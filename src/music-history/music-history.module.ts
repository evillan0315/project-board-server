import { Module } from '@nestjs/common';
import { MusicHistoryService } from './music-history.service';
import { MusicHistoryController } from './music-history.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleControlModule } from '../module-control/module-control.module';
@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [MusicHistoryController],
  providers: [MusicHistoryService],
})
export class MusicHistoryModule {}
