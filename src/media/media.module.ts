import { Module } from '@nestjs/common';

import { ModuleControlModule } from '../module-control/module-control.module';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';

import { PrismaModule } from '../prisma/prisma.module';
import { PlaylistModule } from '../playlist/playlist.module';
import { PlaylistService } from '../playlist/playlist.service';
import { TranscriptionService } from './transcription.service';
import { PlaylistController } from '../playlist/playlist.controller';
import { SongModule } from '../song/song.module';
import { VideoModule } from '../video/video.module';
import { ArtistModule } from '../artist/artist.module';
import { AlbumModule } from '../album/album.module';

@Module({
  imports: [
    PrismaModule,
    PlaylistModule,
    ModuleControlModule,
    SongModule,
    VideoModule,
    ArtistModule,
    AlbumModule,
  ],
  providers: [MediaService, PlaylistService, TranscriptionService],
  controllers: [MediaController, PlaylistController],
  exports: [TranscriptionService, MediaService], // Export MediaService if other modules might need it
})
export class MediaModule {}
