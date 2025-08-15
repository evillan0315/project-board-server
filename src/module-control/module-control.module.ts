import { Module } from '@nestjs/common';
import { ModuleControlService } from './module-control.service';

@Module({
  providers: [ModuleControlService],
  exports: [ModuleControlService], // Export the service so other modules can use it
})
export class ModuleControlModule {}
