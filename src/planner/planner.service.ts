// FIlePath: src/planner/planner.service.ts
// Title: Optimized PlannerService for AI-generated plans with type fixes
// Reason: Fix TS errors by providing missing DTO fields and ensuring non-undefined arrays

import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { LlmService } from '@/llm/llm.service';
import { ExecutorService } from './executor.service';
import { FileChangeDto, GeneratedPlanDto } from './dto';
import { LlmInputDto } from '@/llm/dto/llm-input.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { PlanService } from '@/plan/plan.service';
import { FileAction } from '@prisma/client';

@Injectable()
export class PlannerService {
  private readonly logger = new Logger(PlannerService.name);

  constructor(
    private readonly llm: LlmService,
    private readonly plan: PlanService,
    private readonly executor: ExecutorService,
    private readonly prisma: PrismaService,
  ) {}

  private normalizeTextField(val: unknown): string | null {
    if (Array.isArray(val)) return val.join('\n');
    if (typeof val === 'string') return val;
    if (val != null) return JSON.stringify(val);
    return null;
  }

  private mapChanges(changes: any[]): FileChangeDto[] {
    return (changes || []).map((c: any, idx: number) => ({
      index: typeof c.index === 'number' ? c.index : idx,
      filePath: c.filePath ?? '',
      action: (c.action ?? 'UPDATE') as FileAction,
      newContent: c.newContent ?? undefined,
      diff: c.diff ?? undefined,
      reason: c.reason ?? undefined,
      estimatedMinutes:
        typeof c.estimatedMinutes === 'number' ? c.estimatedMinutes : undefined,
    }));
  }

  private mapPlanToDto(plan: any): GeneratedPlanDto {
    return {
      id: plan.id,
      title: plan.title,
      summary: plan.summary ?? undefined,
      thoughtProcess: plan.thoughtProcess ?? undefined,
      assumptions: plan.assumptions ?? undefined,
      documentationId: plan.documentationId ?? undefined,
      llmInput: plan.llmInput as any,
      createdById: plan.createdById ?? undefined,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt ?? undefined,
      lastExecutionStatus: plan.lastExecutionStatus ?? undefined,
      lastExecutionError: plan.lastExecutionError ?? undefined,
      lastExecutionTimestamp: plan.lastExecutionTimestamp ?? undefined,
      changes: this.mapChanges(plan.changes || []),
      estimatedEffortMinutes: plan.estimatedEffortMinutes ?? undefined,
      confidence: plan.confidence ?? undefined,
      projectRoot: plan.projectRoot ?? undefined,
      gitInstructions: plan.gitInstructions ?? undefined,
      llmRequestId: plan.llmRequestId ?? undefined,
      buildScripts: plan.buildScripts ?? undefined,
      metadata: plan.metadata ?? undefined,
      error: plan.error ?? undefined,
    };
  }

  async createPlan(
    rawPlan: any,
    llmInput: LlmInputDto,
    userId: string,
  ): Promise<{ planId: string; plan: GeneratedPlanDto }> {
    const thoughtProcessValue = this.normalizeTextField(rawPlan.thoughtProcess);
    const assumptionsValue = this.normalizeTextField(rawPlan.assumptions);
    const documentationContent =
      typeof rawPlan.documentation === 'string' ? rawPlan.documentation : null;
    const rawChanges = Array.isArray(rawPlan.changes) ? rawPlan.changes : [];

    try {
      const createdPlan = await this.prisma.$transaction(async (tx) => {
        let documentationRecord: any = null;
        if (documentationContent) {
          documentationRecord = await tx.documentation.create({
            data: {
              name: `${rawPlan.title ?? 'Plan'} Documentation`,
              content: documentationContent,
              createdById: userId,
            },
          });
        }

        return tx.plan.create({
          data: {
            title: rawPlan.title ?? 'Untitled Plan',
            summary: rawPlan.summary ?? null,
            thoughtProcess: thoughtProcessValue,
            documentationId: documentationRecord?.id ?? null,
            assumptions: assumptionsValue,
            llmInput: llmInput as any,
            createdById: userId,
            changes: { create: this.mapChanges(rawChanges) },
            estimatedEffortMinutes:
              typeof rawPlan.estimatedEffortMinutes === 'number'
                ? rawPlan.estimatedEffortMinutes
                : null,
            confidence:
              typeof rawPlan.confidence === 'number'
                ? rawPlan.confidence
                : null,
            projectRoot: rawPlan.projectRoot ?? null,
          },
          include: { changes: true, documentation: true },
        });
      });
      return { planId: createdPlan.id, plan: this.mapPlanToDto(createdPlan) };
    } catch (err) {
      this.logger.error('Failed to persist plan', (err as Error).message);
      throw new InternalServerErrorException(
        'Failed to persist generated plan.',
      );
    }
  }

  async generatePlan(llmInput: LlmInputDto): Promise<string | null> {
    const genPlan = await this.llm.generateContent(llmInput);
    this.logger.log(
      `--- LLM Generated Plan (raw, ${genPlan?.length ?? 0} chars) ---`,
    );
    return LlmService.extractJsonFromMarkdown(genPlan || '');
  }

  async getPlan(planId: string): Promise<GeneratedPlanDto> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      include: { changes: true, documentation: true },
    });
    if (!plan) throw new NotFoundException(`Plan with ID ${planId} not found`);
    return this.mapPlanToDto(plan);
  }

  async chunkPlan(planId: string, size = 3): Promise<FileChangeDto[][]> {
    const plan = await this.getPlan(planId);
    const chunks: FileChangeDto[][] = [];
    const changes = plan.changes || [];
    for (let i = 0; i < changes.length; i += size) {
      chunks.push(changes.slice(i, i + size));
    }
    return chunks;
  }

  async applyChunk(planId: string, chunkIndex: number) {
    const plan = await this.getPlan(planId);
    const chunks = await this.chunkPlan(planId);
    if (!chunks[chunkIndex])
      throw new NotFoundException(`Chunk ${chunkIndex} not found`);

    const result = await this.executor.snapshotAndApply(
      plan.title || planId,
      chunks[chunkIndex],
      plan.llmInput?.projectRoot ?? process.cwd(),
    );

    await this.prisma.plan.update({
      where: { id: planId },
      data: {
        lastExecutionStatus: result.ok ? 'SUCCESS' : 'FAILURE',
        lastExecutionError: result.error ?? null,
        lastExecutionTimestamp: new Date(),
      },
    });

    return result;
  }

  async applyPlan(planId: string, projectRootOverride?: string) {
    try {
      const plan = await this.getPlan(planId);
      const targetRoot =
        projectRootOverride ?? plan.llmInput?.projectRoot ?? process.cwd();

      // ensure changes is always an array
      const changesToApply = plan.changes ?? [];

      const res = await this.executor.snapshotAndApply(
        plan.title || 'plan',
        changesToApply,
        targetRoot,
      );

      await this.prisma.plan.update({
        where: { id: planId },
        data: {
          lastExecutionStatus: res.ok ? 'SUCCESS' : 'FAILURE',
          lastExecutionError: res.error ?? null,
          lastExecutionTimestamp: new Date(),
        },
      });

      return { ok: true, result: res };
    } catch (err) {
      this.logger.error('Failed to apply plan', (err as Error).message);
      throw new InternalServerErrorException(
        `Failed to apply plan: ${(err as Error).message}`,
      );
    }
  }
}
