import { Controller, Post, Body } from '@nestjs/common';
import { PlannerService } from './planner.service';
import { PlanDto } from './types';

@Controller('plan')
export class PlannerController {
  constructor(private readonly planner: PlannerService) {}

  @Post()
  async createPlan(@Body() body: { prompt?: string }) {
    const prompt = body.prompt || '';
    const plan = await this.planner.planFromPrompt(prompt);
    return plan;
  }

  @Post('apply')
  async applyPlan(@Body() body: { plan: PlanDto }) {
    const result = await this.planner.applyPlan(body.plan);
    return result;
  }
}
