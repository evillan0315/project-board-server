import { Module } from '@nestjs/common';
import { PlaylistMediaFileService } from './playlist-media-file.service';
import { PlaylistMediaFileController } from './playlist-media-file.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleControlModule } from '../module-control/module-control.module';
@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [PlaylistMediaFileController],
  providers: [PlaylistMediaFileService],
})
export class PlaylistMediaFileModule {}
