import { Module } from '@nestjs/common';
import { IconService } from './icon.service';
import { IconController } from './icon.controller';

@Module({
  providers: [IconService],
  controllers: [IconController],
})
export class IconModule {}
