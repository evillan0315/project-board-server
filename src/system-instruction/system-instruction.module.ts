import { Module } from '@nestjs/common';
import { SystemInstructionService } from './system-instruction.service';
import { SystemInstructionController } from './system-instruction.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleControlModule } from '../module-control/module-control.module';
@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [SystemInstructionController],
  providers: [SystemInstructionService],
})
export class SystemInstructionModule {}
