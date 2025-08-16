import { Module } from '@nestjs/common';
import { TerminalCommandService } from './terminal-command.service';
import { TerminalCommandController } from './terminal-command.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleControlModule } from '../module-control/module-control.module';
@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [TerminalCommandController],
  providers: [
      TerminalCommandService,
      
    ]
})
export class TerminalCommandModule {}

