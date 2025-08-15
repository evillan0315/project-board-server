import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FfmpegService } from './ffmpeg.service';
import { FfmpegGateway } from './ffmpeg.gateway';
import { SubtitleService } from '../subtitle/subtitle.service';
import * as fs from 'fs';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'downloads/videos/hls'),
      serveRoot: '/hls',
      serveStaticOptions: {
        setHeaders: (res) => {
          res.setHeader('Cache-Control', 'public, max-age=31536000');
        },
      },
    }),
  ],
  providers: [FfmpegService, FfmpegGateway, SubtitleService],
  exports: [FfmpegService, SubtitleService],
})
export class FfmpegModule {
  constructor() {
    const hlsDir = join(process.cwd(), 'downloads/videos/hls');
    if (!fs.existsSync(hlsDir)) {
      fs.mkdirSync(hlsDir, { recursive: true });
    }
  }
}
