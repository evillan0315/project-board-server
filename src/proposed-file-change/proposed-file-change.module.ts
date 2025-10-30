import { Module } from '@nestjs/common';
import { ProposedFileChangeService } from './proposed-file-change.service';
import { ProposedFileChangeController } from './proposed-file-change.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleControlModule } from '../module-control/module-control.module';
@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [ProposedFileChangeController],
  providers: [
      ProposedFileChangeService,
      
    ]
})
export class ProposedFileChangeModule {}

