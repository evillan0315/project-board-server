import { Module } from '@nestjs/common';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';
import { ExecutorService } from './executor.service';
import { LlmModule } from '@/llm/llm.module';
import { ConfigModule } from '@nestjs/config';
import { GitModule } from '@/git/git.module';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [ConfigModule, GitModule, PrismaModule, LlmModule],
  controllers: [PlannerController],
  providers: [PlannerService, ExecutorService],
  exports: [PlannerService],
})
export class PlannerModule {}
