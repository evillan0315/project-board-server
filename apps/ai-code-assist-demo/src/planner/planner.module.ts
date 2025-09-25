import { Module } from '@nestjs/common';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';
import { LlmMockService } from './llm-mock.service';
import { ExecutorService } from './executor.service';

@Module({
  controllers: [PlannerController],
  providers: [PlannerService, LlmMockService, ExecutorService]
})
export class PlannerModule {}
