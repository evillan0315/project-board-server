import { Injectable } from '@nestjs/common';
import { LlmMockService } from './llm-mock.service';
import { ExecutorService } from './executor.service';
import { PlanDto } from './types';

@Injectable()
export class PlannerService {
  constructor(
    private readonly llm: LlmMockService,
    private readonly executor: ExecutorService
  ) {}

  async planFromPrompt(prompt: string): Promise<PlanDto> {
    // In production this would call an LLM client
    const plan = this.llm.generatePlan(prompt);
    return plan;
  }

  async applyPlan(plan: PlanDto) {
    // Validate plan shape lightly (runtime)
    if (!plan || !Array.isArray(plan.changes)) {
      return { ok: false, error: 'Invalid plan' };
    }
    // Apply changes
    try {
      const res = await this.executor.apply(plan.changes);
      return { ok: true, result: res };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }
}
