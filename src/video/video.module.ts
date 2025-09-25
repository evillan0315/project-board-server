import { Module } from '@nestjs/common';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleControlModule } from '../module-control/module-control.module';
@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [VideoController],
  providers: [VideoService],
})
export class VideoModule {}
