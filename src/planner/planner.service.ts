import { Injectable } from '@nestjs/common';
import { LlmService } from './llm.service';
import { ExecutorService } from './executor.service';
import { PlanDto, FileChangeDto } from './types';
import { validatePlan } from './validator';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PlannerService {
  private plans = new Map<string, PlanDto>();

  constructor(
    private readonly llm: LlmService,
    private readonly executor: ExecutorService
  ) {}

  async planFromPrompt(prompt: string): Promise<{ planId: string; plan: PlanDto }> {
    const raw = await this.llm.generatePlan(prompt);
    try {
      validatePlan(raw as unknown);
    } catch (err) {
      // rethrow for controller to surface
      throw err;
    }
    const id = uuidv4();
    this.plans.set(id, raw);
    return { planId: id, plan: raw };
  }

  getPlan(planId: string) {
    return this.plans.get(planId);
  }

  // chunkPlan splits changes into groups (size defaults to 3)
  chunkPlan(planId: string, size = 3) {
    const p = this.plans.get(planId);
    if (!p) return null;
    const chunks: FileChangeDto[][] = [];
    for (let i = 0; i < p.changes.length; i += size) {
      chunks.push(p.changes.slice(i, i + size));
    }
    return chunks;
  }

  // apply a single chunk by index (executor handles snapshot/rollback)
  async applyChunk(planId: string, chunkIndex: number) {
    const p = this.plans.get(planId);
    if (!p) throw new Error('plan not found');
    const chunks = this.chunkPlan(planId);
    if (!chunks || !chunks[chunkIndex]) throw new Error('chunk not found');
    const snapshot = await this.executor.snapshotAndApply(p.title || planId, chunks[chunkIndex]);
    return snapshot;
  }

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
