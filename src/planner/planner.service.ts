// FilePath: src/planner/planner.service.ts
// Title: Planner service to generate, validate, chunk, and apply AI-generated file change plans
// Reason: Provides the core business logic for creating AI-driven plans and applying them safely
//         using the ExecutorService, with proper validation and error handling.

import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { LlmService } from './llm.service';
import { ExecutorService } from './executor.service';
import { FileChangeDto, CreatePlannerDto as PlanDto } from './dto';
import { validatePlan } from './validator';
import { LlmInputDto } from '@/llm/dto/llm-input.dto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PlannerService {
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
  ): Promise<{ planId: string; plan: PlanDto }> {
    const rawPlan = await this.llm.generatePlan(llmInput);
    validatePlan(rawPlan as unknown); // Throws on invalid

    const createdPlan = await this.prisma.plan.create({
      data: {
        title: rawPlan.title,
        summary: rawPlan.summary,
        thoughtProcess: rawPlan.thoughtProcess,
        documentation: rawPlan.documentation,
        gitInstructions: rawPlan.gitInstructions || [],
        llmInput: llmInput as any, // Store the input for reference
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
      include: { changes: true },
    });

    // Convert Prisma Plan to DTO structure for consistent output
    const planDto: PlanDto = {
      planId: createdPlan.id,
      title: createdPlan.title,
      summary: createdPlan.summary || undefined,
      thoughtProcess: createdPlan.thoughtProcess || undefined,
      documentation: createdPlan.documentation || undefined,
      gitInstructions: createdPlan.gitInstructions || undefined,
      changes: createdPlan.changes.map(change => ({
        filePath: change.filePath,
        action: change.action,
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
      include: { changes: true },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    const planDto: PlanDto = {
      planId: plan.id,
      title: plan.title,
      summary: plan.summary || undefined,
      thoughtProcess: plan.thoughtProcess || undefined,
      documentation: plan.documentation || undefined,
      gitInstructions: plan.gitInstructions || undefined,
      changes: plan.changes.map(change => ({
        filePath: change.filePath,
        action: change.action,
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
   */
  async applyPlan(plan: PlanDto) {
    try {
      validatePlan(plan as unknown);
    } catch (err) {
      throw new BadRequestException(`Plan validation failed: ${(err as Error).message}`);
    }

    try {
      // Before applying, ensure the plan is saved if it's new, or retrieved if existing
      let existingPlan = null;
      if (plan.planId) {
        existingPlan = await this.getPlan(plan.planId);
      } else {
        // If no planId, it means a client sent a raw plan, we should save it first
        // This part needs adjustment based on whether clients are expected to send unsaved plans
        // For now, assume a plan with planId is always from the DB or a new plan is created via /plan endpoint
        throw new InternalServerErrorException('Raw plans without an ID must be generated via the /plan endpoint first.');
      }

      const res = await this.executor.snapshotAndApply(
        existingPlan.title || 'plan',
        existingPlan.changes,
      );

      // Update the plan in the database with execution status
      await this.prisma.plan.update({
        where: { id: existingPlan.planId },
        data: {
          lastExecutionStatus: res.ok ? 'SUCCESS' : 'FAILURE',
          lastExecutionError: res.error,
          lastExecutionTimestamp: new Date(),
          // Link to an ExecutionSnapshot if you create one in ExecutorService
        },
      });

      return { ok: true, result: res };
    } catch (err) {
      throw new InternalServerErrorException(`Failed to apply plan: ${(err as Error).message}`);
    }
  }
}
