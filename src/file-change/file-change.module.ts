import { Module } from '@nestjs/common';
import { FileChangeService } from './file-change.service';
import { FileChangeController } from './file-change.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleControlModule } from '../module-control/module-control.module';
@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [FileChangeController],
  providers: [FileChangeService],
})
export class FileChangeModule {}
