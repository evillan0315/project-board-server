import { Module } from '@nestjs/common';
import { FavoriteSongService } from './favorite-song.service';
import { FavoriteSongController } from './favorite-song.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleControlModule } from '../module-control/module-control.module';
@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [FavoriteSongController],
  providers: [FavoriteSongService],
})
export class FavoriteSongModule {}
