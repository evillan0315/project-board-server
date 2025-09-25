import { Module } from '@nestjs/common';
import { FavoriteVideoService } from './favorite-video.service';
import { FavoriteVideoController } from './favorite-video.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleControlModule } from '../module-control/module-control.module';
@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [FavoriteVideoController],
  providers: [FavoriteVideoService],
})
export class FavoriteVideoModule {}
