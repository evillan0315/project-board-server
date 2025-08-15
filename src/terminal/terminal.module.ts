import { Module, forwardRef } from '@nestjs/common';
import { TerminalGateway } from './terminal.gateway';
import { TerminalController } from './terminal.controller';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { TerminalService } from './terminal.service';
import { ModuleControlModule } from '../module-control/module-control.module';

import { PrismaService } from '../prisma/prisma.service';
@Module({
  imports: [UserModule, AuthModule, ModuleControlModule],
  providers: [TerminalGateway, TerminalService, PrismaService],
  controllers: [TerminalController],
  exports: [TerminalService],
})
export class TerminalModule {}
