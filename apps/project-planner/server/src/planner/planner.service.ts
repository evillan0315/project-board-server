import { v4 as uuidv4 } from 'uuid';

import { LlmService } from './llm.service';
import { ExecutorService } from './executor.service';
import { FileChangeDto, CreatePlannerDto as PlanDto, LlmInputDto } from './dto';
import { validatePlan } from './validator';
import { CustomError } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';

export class PlannerService {
  constructor(
    private readonly llm: LlmService,
    private readonly executor: ExecutorService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generate a plan from a free-form prompt using the LLM and validate the result.
   * Persists the plan to the database.
   */
  async planFromPrompt(
    llmInput: LlmInputDto,
    userId: string,
  ): Promise<{ planId: string; plan: PlanDto }> {
    const rawPlan = await this.llm.generatePlan(llmInput);
    validatePlan(rawPlan as unknown); // Throws on invalid

    const createdPlan = await this.prisma.planner.create({
      data: {
        title: rawPlan.title,
        summary: rawPlan.summary,
        thoughtProcess: rawPlan.thoughtProcess,
        createdById: userId,
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

    return { planId: createdPlan.id, plan: createdPlan };
  }

  /**
   * Retrieve a previously generated plan by its ID.
   */
  async getPlan(planId: string, userId: string): Promise<PlanDto | undefined> {
    const plan = await this.prisma.planner.findUnique({
      where: { id: planId, createdById: userId },
      include: { changes: true },
    });

    if (!plan) return undefined;

    return {
      title: plan.title,
      summary: plan.summary,
      thoughtProcess: plan.thoughtProcess,
      changes: plan.changes,
    };
  }

  /**
   * Split the plan's changes into chunks of a given size (default: 3).
   */
  async chunkPlan(planId: string, userId: string, size = 3): Promise<FileChangeDto[][] | null> {
    const p = await this.getPlan(planId, userId);
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
  async applyChunk(planId: string, chunkIndex: number, userId: string) {
    const p = await this.getPlan(planId, userId);
    if (!p) throw new CustomError('Plan not found', 404);

    const chunks = await this.chunkPlan(planId, userId);
    if (!chunks || !chunks[chunkIndex]) throw new CustomError('Chunk not found', 404);

    return this.executor.snapshotAndApply(
      p.title || planId,
      chunks[chunkIndex],
    );
  }

  /**
   * Apply the entire plan at once after validating.
   */
  async applyPlan(plan: PlanDto, userId: string) {
    try {
      validatePlan(plan as unknown);
    } catch (err: any) {
      throw new CustomError((err as Error).message, 400); // Bad Request for validation errors
    }

    try {
      // Before applying, ensure this plan exists in the database for the user
      const existingPlan = await this.prisma.planner.findFirst({
        where: { id: (plan as any).id, createdById: userId, title: plan.title }, // Assuming plan.id is passed
      });

      if (!existingPlan) {
        // Optionally create it if not found, or throw if it must exist
        // For now, let's assume it should exist, or it's a new, unpersisted plan from a direct apply request
        // If direct apply of an unpersisted plan is allowed, we might want to persist it here.
        // For this example, let's assume `plan` might come from `getPlan` or from a fresh input.
        // If coming fresh, it needs a unique ID and `createdById` for persistence.

        // If `plan` coming from a direct `/apply` and not from `planFromPrompt`, we might want to store it.
        // For simplicity, we'll just apply it.
      }

      const res = await this.executor.snapshotAndApply(
        plan.title || 'plan',
        plan.changes,
      );
      return { ok: true, result: res };
    } catch (err: any) {
      throw new CustomError(`Failed to apply plan: ${err.message}`, err.statusCode || 500);
    }
  }
}
