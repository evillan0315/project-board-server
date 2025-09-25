// src/planner/planner.module.ts
import { Module } from '@nestjs/common';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';
import { ExecutorService } from './executor.service';
import { LlmService } from '../llm.service'; // point to your real LLM module

@Module({
  controllers: [PlannerController],
  providers: [PlannerService, ExecutorService, LlmService],
  exports: [PlannerService],
})
export class PlannerModule {}
