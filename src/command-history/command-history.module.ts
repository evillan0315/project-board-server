import { Module } from '@nestjs/common';
import { CommandHistoryService } from './command-history.service';
import { CommandHistoryController } from './command-history.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleControlModule } from '../module-control/module-control.module';
@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [CommandHistoryController],
  providers: [
      CommandHistoryService,
      
    ]
})
export class CommandHistoryModule {}

