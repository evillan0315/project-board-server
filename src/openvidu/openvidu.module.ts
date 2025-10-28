import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenviduService } from './openvidu.service';
import { OpenviduController } from './openvidu.controller';

@Module({
  imports: [ConfigModule],
  providers: [OpenviduService],
  controllers: [OpenviduController],
  exports: [OpenviduService],
})
export class OpenviduModule {}
