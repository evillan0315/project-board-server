import { Module } from '@nestjs/common';
import { VideoHistoryService } from './video-history.service';
import { VideoHistoryController } from './video-history.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleControlModule } from '../module-control/module-control.module';
@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [VideoHistoryController],
  providers: [VideoHistoryService],
})
export class VideoHistoryModule {}
