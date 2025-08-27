import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { MediaGateway } from './media.gateway';

@Module({
  providers: [MediaService, MediaGateway],
  controllers: [MediaController],
})
export class MediaModule {}
