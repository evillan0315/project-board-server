// src/module-control/module-control.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Import ConfigService
/**
 * Interface for a configurable module.
 */
export interface ConfigurableModule {
  name: string;
  enabled: boolean;
}
@Injectable()
export class ModuleControlService implements OnModuleInit {
  private readonly logger = new Logger(ModuleControlService.name);
  private modules: Map<string, ConfigurableModule> = new Map();
  constructor(private readonly configService: ConfigService) {} // Inject ConfigService
  // OnModuleInit is a lifecycle hook that runs after the module's dependencies have been resolved.
  // This is a good place to load initial data that depends on injected services like ConfigService.
  onModuleInit() {
    this.logger.log('ModuleControlService initializing modules from config...');
    const featureModules =
      this.configService.get<ConfigurableModule[]>('featureModules');

    if (featureModules && Array.isArray(featureModules)) {
      featureModules.forEach((moduleConfig) => {
        if (
          typeof moduleConfig.name === 'string' &&
          typeof moduleConfig.enabled === 'boolean'
        ) {
          this.registerModule(moduleConfig.name, moduleConfig.enabled);
        } else {
          this.logger.warn(
            `Invalid module configuration found: ${JSON.stringify(moduleConfig)}`,
          );
        }
      });
      this.logger.log(
        `Successfully registered ${featureModules.length} modules from configuration.`,
      );
    } else {
      this.logger.warn(
        'No "featureModules" array found in configuration or it is invalid. No modules registered from config.',
      );
    }
  }

  /**
   * Registers a module with the control service.
   * @param name The name of the module to register.
   * @param initialStatus The initial enabled status of the module.
   */
  registerModule(name: string, initialStatus: boolean = false): void {
    if (this.modules.has(name)) {
      this.logger.warn(`Module '${name}' is already registered.`);
      return;
    }
    this.modules.set(name, { name, enabled: initialStatus });
    this.logger.log(
      `Module '${name}' registered with initial status: ${initialStatus ? 'enabled' : 'disabled'}.`,
    );
  }

  /**
   * Enables a specific module.
   * @param name The name of the module to enable.
   * @returns True if the module was found and enabled, false otherwise.
   */
  enableModule(name: string): boolean {
    const module = this.modules.get(name);
    if (module) {
      module.enabled = true;
      this.logger.log(`Module '${name}' enabled.`);
      return true;
    }
    this.logger.warn(`Module '${name}' not found for enabling.`);
    return false;
  }

  /**
   * Disables a specific module.
   * @param name The name of the module to disable.
   * @returns True if the module was found and disabled, false otherwise.
   */
  disableModule(name: string): boolean {
    const module = this.modules.get(name);
    if (module) {
      module.enabled = false;
      this.logger.log(`Module '${name}' disabled.`);
      return true;
    }
    this.logger.warn(`Module '${name}' not found for disabling.`);
    return false;
  }

  /**
   * Toggles the enabled status of a specific module.
   * @param name The name of the module to toggle.
   * @returns The new status of the module, or undefined if not found.
   */
  toggleModule(name: string): boolean | undefined {
    const module = this.modules.get(name);
    if (module) {
      module.enabled = !module.enabled;
      this.logger.log(
        `Module '${name}' toggled to: ${module.enabled ? 'enabled' : 'disabled'}.`,
      );
      return module.enabled;
    }
    this.logger.warn(`Module '${name}' not found for toggling.`);
    return undefined;
  }

  /**
   * Checks if a module is currently enabled.
   * @param name The name of the module to check.
   * @returns True if the module is enabled, false if disabled or not registered.
   */
  isModuleEnabled(name: string): boolean {
    const module = this.modules.get(name);
    const status = module ? module.enabled : false;
    this.logger.debug(
      `Checking status for '${name}': ${status ? 'enabled' : 'disabled'}.`,
    );
    return status;
  }

  /**
   * Gets the status of all registered modules.
   * @returns An array of configurable module states.
   */
  getAllModuleStatuses(): ConfigurableModule[] {
    return Array.from(this.modules.values());
  }
}
