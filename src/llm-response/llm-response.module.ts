import { Module } from '@nestjs/common';
import { LlmResponseService } from './llm-response.service';
import { LlmResponseController } from './llm-response.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleControlModule } from '../module-control/module-control.module';
@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [LlmResponseController],
  providers: [
      LlmResponseService,
      
    ]
})
export class LlmResponseModule {}

