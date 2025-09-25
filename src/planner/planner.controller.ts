import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { PlannerService } from './planner.service';
import { PlanDto } from './types';

@Controller('plan')
export class PlannerController {
  constructor(private readonly planner: PlannerService) {}

  @Post()
  async createPlan(@Body() body: { prompt?: string }) {
    const prompt = body.prompt || '';
    const result = await this.planner.planFromPrompt(prompt);
    return result;
  }

  @Get(':id')
  async getPlan(@Param('id') id: string) {
    const plan = this.planner.getPlan(id);
    return { plan };
  }

  @Get(':id/chunks')
  async getChunks(@Param('id') id: string) {
    const chunks = this.planner.chunkPlan(id);
    return { chunks };
  }

  @Post(':id/apply-chunk/:index')
  async applyChunk(@Param('id') id: string, @Param('index') index: string) {
    const idx = parseInt(index, 10);
    const res = await this.planner.applyChunk(id, idx);
    return res;
  }

  @Post('apply')
  async applyPlan(@Body() body: { plan: PlanDto }) {
    const result = await this.planner.applyPlan(body.plan);
    return result;
  }
}
