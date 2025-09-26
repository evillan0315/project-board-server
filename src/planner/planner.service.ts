// FilePath: src/planner/planner.service.ts
// Title: Planner service to generate, validate, chunk, and apply AI-generated file change plans
// Reason: Provides the core business logic for creating AI-driven plans and applying them safely
//         using the ExecutorService, with proper validation and error handling.

import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { LlmService } from './llm.service';
import { ExecutorService } from './executor.service';
import {
  FileChangeDto,
  CreatePlannerDto as PlanDto,
} from './dto';
import { validatePlan } from './validator';

@Injectable()
export class PlannerService {
  private plans = new Map<string, PlanDto>();

  constructor(
    private readonly llm: LlmService,
    private readonly executor: ExecutorService,
  ) {}

  /**
   * Generate a plan from a free-form prompt using the LLM and validate the result.
   */
  async planFromPrompt(prompt: string): Promise<{ planId: string; plan: PlanDto }> {
    const raw = await this.llm.generatePlan(prompt);
    validatePlan(raw as unknown); // Throws on invalid
    const id = uuidv4();
    this.plans.set(id, raw);
    return { planId: id, plan: raw };
  }

  /**
   * Retrieve a previously generated plan by its ID.
   */
  getPlan(planId: string): PlanDto | undefined {
    return this.plans.get(planId);
  }

  /**
   * Split the plan's changes into chunks of a given size (default: 3).
   */
  chunkPlan(planId: string, size = 3): FileChangeDto[][] | null {
    const p = this.plans.get(planId);
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
    const p = this.plans.get(planId);
    if (!p) throw new Error('plan not found');
    const chunks = this.chunkPlan(planId);
    if (!chunks || !chunks[chunkIndex]) throw new Error('chunk not found');
    return this.executor.snapshotAndApply(p.title || planId, chunks[chunkIndex]);
  }

  /**
   * Apply the entire plan at once after validating.
   */
  async applyPlan(plan: PlanDto) {
    try {
      validatePlan(plan as unknown);
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }

    try {
      const res = await this.executor.snapshotAndApply(plan.title || 'plan', plan.changes);
      return { ok: true, result: res };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }
}

