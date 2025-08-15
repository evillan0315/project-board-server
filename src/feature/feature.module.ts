import { Module } from '@nestjs/common';
import { FeatureService } from './feature.service';
import { FeatureController } from './feature.controller';
import { ModuleControlModule } from '../module-control/module-control.module'; // Import the control module

@Module({
  imports: [ModuleControlModule], // Make ModuleControlService available here
  providers: [FeatureService],
  controllers: [FeatureController],
})
export class FeatureModule {}
