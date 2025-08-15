import { Module } from '@nestjs/common';
import { SetupController } from './setup.controller';
import { EnvSetupService } from './env-setup.service';

@Module({
  controllers: [SetupController],
  providers: [EnvSetupService],
})
export class SetupModule {}
