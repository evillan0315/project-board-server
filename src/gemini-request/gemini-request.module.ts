import { Module } from '@nestjs/common';
import { GeminiRequestService } from './gemini-request.service';
import { GeminiRequestController } from './gemini-request.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleControlModule } from '../module-control/module-control.module';
@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [GeminiRequestController],
  providers: [GeminiRequestService],
})
export class GeminiRequestModule {}
