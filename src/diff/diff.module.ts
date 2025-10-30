import { Module } from '@nestjs/common';
import { DiffService } from './diff.service';
import { DiffController } from './diff.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleControlModule } from '../module-control/module-control.module';
@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [DiffController],
  providers: [
      DiffService,
      
    ]
})
export class DiffModule {}

