// src/feature/feature.controller.ts
import {
  Controller,
  Get,
  Param,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FeatureService } from './feature.service';
import {
  ModuleControlService,
  ConfigurableModule,
} from '../module-control/module-control.service'; // Import ConfigurableModule

@Controller('feature')
export class FeatureController {
  private readonly logger = new Logger(FeatureController.name);

  constructor(
    private readonly featureService: FeatureService,
    private readonly moduleControlService: ModuleControlService, // Inject the control service
  ) {}

  // --- API Endpoints to control module status at runtime ---

  @Get('status/:moduleName')
  getModuleStatus(@Param('moduleName') moduleName: string): {
    module: string;
    enabled: boolean;
  } {
    const enabled = this.moduleControlService.isModuleEnabled(moduleName);
    this.logger.log(`Requested status for '${moduleName}': ${enabled}`);
    return { module: moduleName, enabled };
  }

  @Get('enable/:moduleName')
  enableModule(@Param('moduleName') moduleName: string): {
    message: string;
    module: string;
    status: boolean;
  } {
    const success = this.moduleControlService.enableModule(moduleName);
    if (!success) {
      throw new BadRequestException(
        `Module '${moduleName}' could not be enabled.`,
      );
    }
    const newStatus = this.moduleControlService.isModuleEnabled(moduleName);
    return {
      message: `Module '${moduleName}' enabled successfully.`,
      module: moduleName,
      status: newStatus,
    };
  }

  @Get('disable/:moduleName')
  disableModule(@Param('moduleName') moduleName: string): {
    message: string;
    module: string;
    status: boolean;
  } {
    const success = this.moduleControlService.disableModule(moduleName);
    if (!success) {
      throw new BadRequestException(
        `Module '${moduleName}' could not be disabled.`,
      );
    }
    const newStatus = this.moduleControlService.isModuleEnabled(moduleName);
    return {
      message: `Module '${moduleName}' disabled successfully.`,
      module: moduleName,
      status: newStatus,
    };
  }

  @Get('toggle/:moduleName')
  toggleModule(@Param('moduleName') moduleName: string): {
    message: string;
    module: string;
    status: boolean;
  } {
    const newStatus = this.moduleControlService.toggleModule(moduleName);
    if (newStatus === undefined) {
      throw new BadRequestException(
        `Module '${moduleName}' not found for toggling.`,
      );
    }
    return {
      message: `Module '${moduleName}' toggled.`,
      module: moduleName,
      status: newStatus,
    };
  }

  @Get('all-statuses')
  getAllStatuses(): ConfigurableModule[] {
    return this.moduleControlService.getAllModuleStatuses();
  }
}
