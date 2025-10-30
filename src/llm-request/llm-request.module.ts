import { Module } from '@nestjs/common';
import { LlmRequestService } from './llm-request.service';
import { LlmRequestController } from './llm-request.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleControlModule } from '../module-control/module-control.module';
@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [LlmRequestController],
  providers: [
      LlmRequestService,
      
    ]
})
export class LlmRequestModule {}

