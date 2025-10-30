import { Module } from '@nestjs/common';
import { ExecutionSnapshotService } from './execution-snapshot.service';
import { ExecutionSnapshotController } from './execution-snapshot.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleControlModule } from '../module-control/module-control.module';
@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [ExecutionSnapshotController],
  providers: [
      ExecutionSnapshotService,
      
    ]
})
export class ExecutionSnapshotModule {}

