// FilePath: src/planner/planner.service.ts
// Title: Planner service to generate, validate, chunk, and apply AI-generated file change plans
// Reason: Provides the core business logic for creating AI-driven plans and applying them safely
//         using the ExecutorService, with proper validation and error handling.
import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { LlmService } from '@/llm/llm.service';
import { ExecutorService } from './executor.service';
import { FileChangeDto, GeneratedPlanDto } from './dto'; // Changed CreatePlannerDto to GeneratedPlanDto
import { PlanDto } from './types'; // Import the full PlanDto from types
import { validatePlan } from './validator';
import { LlmInputDto } from '@/llm/dto/llm-input.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { FileAction, Documentation as PrismaDocumentation } from '@prisma/client';
@Injectable()
export class PlannerService {
  private readonly logger = new Logger(PlannerService.name);
  constructor(
    private readonly llm: LlmService,
    private readonly executor: ExecutorService,
    private readonly prisma: PrismaService,
  ) {}
  /**
   * Generate a plan from a free-form prompt using the LLM and validate the result,
   * then store it in the database.
   */
  async planFromPrompt(
    llmInput: LlmInputDto,
    userId: string, // Added userId for createdById relation
  ): Promise<{ planId: string; plan: PlanDto }> {
    const genPlan = await this.llm.generateContent(llmInput);
    this.logger.log(genPlan);
    this.logger.log('\n--- genPlan received by LLM ---');
    this.logger.log(`GenPlan size: ${genPlan.length} characters.`);
    this.logger.log('--------------------------\n');
    const rawPlan: GeneratedPlanDto = JSON.parse(LlmService.extractJsonFromMarkdown(genPlan));
    validatePlan(rawPlan as unknown); // Throws on invalid
    let documentationId: string | null = null;
    if (rawPlan.documentation) {
      const newDoc = await this.prisma.documentation.create({
        data: {
          name: `${rawPlan.title} Documentation`, // Generate a name for the documentation
          content: rawPlan.documentation,
          createdById: userId,
        },
      });
      documentationId = newDoc.id;
    }
    const createdPlan = await this.prisma.plan.create({
      data: {
        title: rawPlan.title,
        summary: rawPlan.summary,
        thoughtProcess: rawPlan.thoughtProcess,
        // Removed redundant `documentation: { connect: ... }` when documentationId is directly set
        documentationId: documentationId,
        gitInstructions: rawPlan.gitInstructions || [],
        llmInput: llmInput as any, // Store the input for reference
        createdById: userId, // Set the creator
        changes: {
          create: rawPlan.changes.map((change) => ({
            filePath: change.filePath,
            action: change.action,
            newContent: change.newContent,
            diff: change.diff,
            reason: change.reason,
          })),
        },
      },
      include: { changes: true, documentation: true }, // Include documentation for the response
    });
    this.logger.log('\n--- created plan id:  ---', createdPlan?.id);
    this.logger.log(createdPlan);
    // Convert Prisma Plan to DTO structure for consistent output
    const planDto: PlanDto = {
      id: createdPlan.id,
      title: createdPlan.title,
      summary: createdPlan.summary || undefined,
      thoughtProcess: createdPlan.thoughtProcess || undefined,
      documentation: createdPlan.documentation?.content || undefined, // Extract content from the linked Documentation entity
      documentationId: createdPlan.documentationId || undefined,
      gitInstructions: createdPlan.gitInstructions || undefined,
      llmInput: createdPlan.llmInput as any,
      createdAt: createdPlan.createdAt,
      updatedAt: createdPlan.updatedAt || undefined,
      lastExecutionStatus: createdPlan.lastExecutionStatus || undefined,
      lastExecutionError: createdPlan.lastExecutionError || undefined,
      lastExecutionTimestamp: createdPlan.lastExecutionTimestamp || undefined,
      createdById: createdPlan.createdById || undefined,
      changes: createdPlan.changes.map(change => ({
        filePath: change.filePath,
        action: change.action as FileAction,
        newContent: change.newContent || undefined,
        diff: change.diff || undefined,
        reason: change.reason || undefined,
      })),
    };
    return { planId: createdPlan.id, plan: planDto };
  }
  /**
   * Retrieve a previously generated plan by its ID from the database.
   */
  async getPlan(planId: string): Promise<PlanDto> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      include: { changes: true, documentation: true, createdBy: true }, // Include related data
    });
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }
    const planDto: PlanDto = {
      id: plan.id,
      title: plan.title,
      summary: plan.summary || undefined,
      thoughtProcess: plan.thoughtProcess || undefined,
      documentation: plan.documentation?.content || undefined, // Extract content
      documentationId: plan.documentationId || undefined,
      gitInstructions: plan.gitInstructions || undefined,
      llmInput: plan.llmInput as any,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt || undefined,
      lastExecutionStatus: plan.lastExecutionStatus || undefined,
      lastExecutionError: plan.lastExecutionError || undefined,
      lastExecutionTimestamp: plan.lastExecutionTimestamp || undefined,
      createdById: plan.createdById || undefined,
      changes: plan.changes.map(change => ({
        filePath: change.filePath,
        action: change.action as FileAction,
        newContent: change.newContent || undefined,
        diff: change.diff || undefined,
        reason: change.reason || undefined,
      })),
    };
    return planDto;
  }
  /**
   * Split the plan's changes into chunks of a given size (default: 3).
   */
  async chunkPlan(planId: string, size = 3): Promise<FileChangeDto[][] | null> {
    const p = await this.getPlan(planId); // Use existing getPlan logic
    if (!p) return null;
    const chunks: FileChangeDto[][] = [];
    for (let i = 0; i < p.changes.length; i += size) {
      chunks.push(p.changes.slice(i, i + size));
    }
    return chunks;
  }
  /**
   * Apply a specific chunk of changes by index.
   * ExecutorService handles snapshot creation and rollback on failure.
   */
  async applyChunk(planId: string, chunkIndex: number) {
    const p = await this.getPlan(planId); // Use existing getPlan logic
    if (!p) throw new NotFoundException(`Plan with ID ${planId} not found`);
    const chunks = await this.chunkPlan(planId);
    if (!chunks || !chunks[chunkIndex]) throw new NotFoundException(`Chunk at index ${chunkIndex} not found for plan ${planId}`);
    const result = await this.executor.snapshotAndApply(
      p.title || planId,
      chunks[chunkIndex],
      // Assuming the project root for execution is the one from the plan or a default
      p.llmInput?.projectRoot as string || process.cwd(),
    );
    // Optionally update the plan in the database with execution status or link to snapshot
    await this.prisma.plan.update({
      where: { id: planId },
      data: {
        lastExecutionStatus: result.ok ? 'SUCCESS' : 'FAILURE',
        lastExecutionError: result.error,
        lastExecutionTimestamp: new Date(),
        // Link to an ExecutionSnapshot if you create one in ExecutorService
      },
    });
    return result;
  }
  /**
   * Apply the entire plan at once after validating.
   * Now takes planId and optional projectRootOverride to apply a persisted plan.
   */
  async applyPlan(planId: string, projectRootOverride?: string) {
    try {
      const targetPlan = await this.getPlan(planId); // Fetch the existing plan by its ID
      const res = await this.executor.snapshotAndApply(
        targetPlan.title || 'plan',
        targetPlan.changes,
        projectRootOverride || (targetPlan.llmInput?.projectRoot as string) || process.cwd(),
      );
      // Update the plan in the database with execution status
      await this.prisma.plan.update({
        where: { id: targetPlan.id },
        data: {
          lastExecutionStatus: res.ok ? 'SUCCESS' : 'FAILURE',
          lastExecutionError: res.error,
          lastExecutionTimestamp: new Date(),
          // Link to an ExecutionSnapshot if you create one in ExecutorService
        },
      });
      return { ok: true, result: res };
    } catch (err) {
      // Catch specific NotFoundException from getPlan if planId is invalid
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(`Failed to apply plan: ${(err as Error).message}`);
    }
  }
}
