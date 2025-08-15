import { Injectable, Logger } from '@nestjs/common';
import { ModuleControlService } from '../module-control/module-control.service';

@Injectable()
export class FeatureService {
  private readonly logger = new Logger(FeatureService.name);

  constructor(private readonly moduleControlService: ModuleControlService) {}

  /**
   * This method performs a feature-specific action, but only if
   * 'FeatureA' is considered enabled by the ModuleControlService.
   */
  performFeatureAction(): string {
    if (this.moduleControlService.isModuleEnabled('FeatureA')) {
      this.logger.log('Performing Feature A action because it is enabled.');
      return 'Feature A functionality is active and executed!';
    } else {
      this.logger.warn('Feature A is disabled. Action not performed.');
      return 'Feature A functionality is currently disabled.';
    }
  }

  /**
   * This method performs a feature-specific action, but only if
   * 'FeatureB' is considered enabled by the ModuleControlService.
   */
  performAnotherFeatureAction(): string {
    if (this.moduleControlService.isModuleEnabled('FeatureB')) {
      this.logger.log('Performing Feature B action because it is enabled.');
      return 'Feature B functionality is active and executed!';
    } else {
      this.logger.warn('Feature B is disabled. Action not performed.');
      return 'Feature B functionality is currently disabled.';
    }
  }
}
