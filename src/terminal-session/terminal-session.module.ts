import { Module } from '@nestjs/common';
import { TerminalSessionService } from './terminal-session.service';
import { TerminalSessionController } from './terminal-session.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleControlModule } from '../module-control/module-control.module';
@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [TerminalSessionController],
  providers: [TerminalSessionService],
})
export class TerminalSessionModule {}
