// FIlePath: src/planner/planner.service.ts
// Title: Planner service to generate, validate, chunk, and apply AI-generated file change plans
// Reason: Updated to match the latest GeneratedPlanDto and Prisma Plan/FileChange models.

import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { LlmService } from '@/llm/llm.service';
import { ExecutorService } from './executor.service';
import { FileChangeDto, GeneratedPlanDto, TestsDto } from './dto';
import { validatePlan } from './validator';
import { LlmInputDto } from '@/llm/dto/llm-input.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { FileAction } from '@prisma/client';

@Injectable()
export class PlannerService {
  private readonly logger = new Logger(PlannerService.name);

  constructor(
    private readonly llm: LlmService,
    private readonly executor: ExecutorService,
    private readonly prisma: PrismaService,
  ) {}

  async planFromPrompt(
    llmInput: LlmInputDto,
    userId: string,
  ): Promise<{ planId: string; plan: GeneratedPlanDto }> {
    const genPlan = await this.llm.generateContent(llmInput);
    this.logger.log('--- LLM Generated Plan ---');
    this.logger.log(`Length: ${genPlan.length} characters`);

    const rawPlan: GeneratedPlanDto = JSON.parse(LlmService.extractJsonFromMarkdown(genPlan));
    validatePlan(rawPlan as unknown);

    let documentationId: string | null = null;
    if (rawPlan.documentation) {
      const newDoc = await this.prisma.documentation.create({
        data: {
          name: `${rawPlan.title} Documentation`,
          content: rawPlan.documentation,
          createdById: userId,
        },
      });
      documentationId = newDoc.id;
    }

    let thoughtProcessValue: string | null = null;
    if (Array.isArray(rawPlan.thoughtProcess)) {
      thoughtProcessValue = rawPlan.thoughtProcess.join('\n');
    } else if (typeof rawPlan.thoughtProcess === 'string') {
      thoughtProcessValue = rawPlan.thoughtProcess;
    } else if (rawPlan.thoughtProcess != null) {
      thoughtProcessValue = JSON.stringify(rawPlan.thoughtProcess);
    }
    
    let assumptionsValue: string | null = null;
    if (Array.isArray(rawPlan.assumptions)) {
      assumptionsValue = rawPlan.assumptions.join('\n');
    } else if (typeof rawPlan.assumptions === 'string') {
      assumptionsValue = rawPlan.assumptions;
    } else if (rawPlan.assumptions != null) {
      assumptionsValue = JSON.stringify(rawPlan.assumptions);
    }
    
    

    const createdPlan = await this.prisma.plan.create({
      data: {
        title: rawPlan.title,
        summary: rawPlan.summary,
        thoughtProcess: thoughtProcessValue,
        documentationId,
        assumptions: assumptionsValue,
        llmInput: llmInput as any,
        createdById: userId,
        changes: {
          create: rawPlan.changes.map((change, index: number) => ({
            index,
            filePath: change.filePath,
            action: change.action,
            newContent: change.newContent,
            diff: change.diff,
            reason: change.reason,
            estimatedMinutes: change.estimatedMinutes,
            //testsAdded: change.testsAdded as any,
          })),
        },
        estimatedEffortMinutes: rawPlan.estimatedEffortMinutes,
        confidence: rawPlan.confidence,
        projectRoot: llmInput.projectRoot
      },
      include: { changes: true, documentation: true },
    });

    const planDto: GeneratedPlanDto = {
      id: createdPlan.id,
      title: createdPlan.title,
      summary: createdPlan.summary || undefined,
      thoughtProcess: createdPlan.thoughtProcess || undefined,
      assumptions: createdPlan.assumptions || undefined,
      documentation: rawPlan.documentation || undefined,
      documentationId: createdPlan.documentationId || undefined,
      llmInput: createdPlan.llmInput as any,
      createdAt: createdPlan.createdAt,
      updatedAt: createdPlan.updatedAt || undefined,
      lastExecutionStatus: createdPlan.lastExecutionStatus || undefined,
      lastExecutionError: createdPlan.lastExecutionError || undefined,
      lastExecutionTimestamp: createdPlan.lastExecutionTimestamp || undefined,
      createdById: createdPlan.createdById || undefined,
      changes: createdPlan.changes.map(change => ({
        index: change.index || undefined,
        filePath: change.filePath,
        action: change.action as FileAction,
        newContent: change.newContent || undefined,
        diff: change.diff || undefined,
        reason: change.reason || undefined,
        estimatedMinutes: change.estimatedMinutes || undefined,
        //testsAdded: change.testsAdded || undefined,
      })),
      estimatedEffortMinutes: createdPlan.estimatedEffortMinutes || undefined,
      confidence: createdPlan.confidence || undefined,
      projectRoot: createdPlan.projectRoot || undefined,
    };

    return { planId: createdPlan.id, plan: planDto };
  }

  async getPlan(planId: string): Promise<GeneratedPlanDto> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      include: { changes: true, documentation: true, createdBy: true },
    });
    if (!plan) throw new NotFoundException(`Plan with ID ${planId} not found`);

    return {
      id: plan.id,
      title: plan.title,
      summary: plan.summary || undefined,
      thoughtProcess: plan.thoughtProcess || undefined,
      assumptions: plan.assumptions || undefined,
      documentation: plan.documentation?.content || undefined,
      documentationId: plan.documentationId || undefined,
      llmInput: plan.llmInput as any,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt || undefined,
      lastExecutionStatus: plan.lastExecutionStatus || undefined,
      lastExecutionError: plan.lastExecutionError || undefined,
      lastExecutionTimestamp: plan.lastExecutionTimestamp || undefined,
      createdById: plan.createdById || undefined,
      changes: plan.changes.map(change => ({
        index: change.index || undefined,
        filePath: change.filePath,
        action: change.action as FileAction,
        newContent: change.newContent || undefined,
        diff: change.diff || undefined,
        reason: change.reason || undefined,
        estimatedMinutes: change.estimatedMinutes || undefined,
        ///testsAdded: change.testsAdded || undefined,
      })),
      estimatedEffortMinutes: plan.estimatedEffortMinutes || undefined,
      confidence: plan.confidence || undefined,
      projectRoot: plan.projectRoot || undefined,
    };
  }

  async chunkPlan(planId: string, size = 3): Promise<FileChangeDto[][] | null> {
    const p = await this.getPlan(planId);
    if (!p) return null;

    const chunks: FileChangeDto[][] = [];
    for (let i = 0; i < p.changes.length; i += size) {
      chunks.push(p.changes.slice(i, i + size));
    }
    return chunks;
  }

  async applyChunk(planId: string, chunkIndex: number) {
    const p = await this.getPlan(planId);
    if (!p) throw new NotFoundException(`Plan with ID ${planId} not found`);

    const chunks = await this.chunkPlan(planId);
    if (!chunks?.[chunkIndex]) throw new NotFoundException(`Chunk ${chunkIndex} not found`);

    const result = await this.executor.snapshotAndApply(
      p.title || planId,
      chunks[chunkIndex],
      p.llmInput?.projectRoot as string || process.cwd(),
    );

    await this.prisma.plan.update({
      where: { id: planId },
      data: {
        lastExecutionStatus: result.ok ? 'SUCCESS' : 'FAILURE',
        lastExecutionError: result.error,
        lastExecutionTimestamp: new Date(),
      },
    });

    return result;
  }

  async applyPlan(planId: string, projectRootOverride?: string) {
    try {
      const targetPlan = await this.getPlan(planId);

      const res = await this.executor.snapshotAndApply(
        targetPlan.title || 'plan',
        targetPlan.changes,
        projectRootOverride || (targetPlan.llmInput?.projectRoot as string) || process.cwd(),
      );

      await this.prisma.plan.update({
        where: { id: targetPlan.id },
        data: {
          lastExecutionStatus: res.ok ? 'SUCCESS' : 'FAILURE',
          lastExecutionError: res.error,
          lastExecutionTimestamp: new Date(),
        },
      });

      return { ok: true, result: res };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException(`Failed to apply plan: ${(err as Error).message}`);
    }
  }
}

