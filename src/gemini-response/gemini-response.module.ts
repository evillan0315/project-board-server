import { Module } from '@nestjs/common';
import { GeminiResponseService } from './gemini-response.service';
import { GeminiResponseController } from './gemini-response.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleControlModule } from '../module-control/module-control.module';
@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [GeminiResponseController],
  providers: [GeminiResponseService],
})
export class GeminiResponseModule {}
