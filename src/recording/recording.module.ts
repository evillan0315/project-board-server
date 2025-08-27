import { Module, forwardRef } from '@nestjs/common';

import { RecordingService } from './recording.service';
import { RecordingController } from './recording.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FfmpegModule } from '../ffmpeg/ffmpeg.module';
import { TerminalModule } from '../terminal/terminal.module';

@Module({
  imports: [PrismaModule, TerminalModule, FfmpegModule],
  controllers: [RecordingController],
  providers: [RecordingService],
  exports: [RecordingService],
})
export class RecordingModule {}
