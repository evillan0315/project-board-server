import { Module } from '@nestjs/common';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';
import { ExecutorService } from './executor.service';
import { LlmService } from './llm.service';
import { ConfigModule } from '@nestjs/config';
import { GitModule } from '@/git/git.module';

@Module({
  imports: [ConfigModule, GitModule],
  controllers: [PlannerController],
  providers: [PlannerService, ExecutorService, LlmService],
  exports: [PlannerService],
})
export class PlannerModule {}
