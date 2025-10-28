import { Module } from '@nestjs/common';
import { LlmPlaywrightService } from './llm-playwright.service';
import { LlmPlaywrightController } from './llm-playwright.controller';
import { GoogleModule } from '../google/google.module';
import { ConfigModule } from '@nestjs/config';
import { ModuleControlModule } from '../module-control/module-control.module';
import { FileModule } from '../file/file.module'; // Ensure FileModule is imported if needed for Base64 conversion or file storage
import { UtilsModule } from '../utils/utils.module'; // For detectLanguage or other utilities

@Module({
  imports: [
    GoogleModule,
    ConfigModule,
    ModuleControlModule,
    FileModule,
    UtilsModule,
  ],
  providers: [LlmPlaywrightService],
  controllers: [LlmPlaywrightController],
  exports: [LlmPlaywrightService], // Export if other modules might need to use it
})
export class LlmPlaywrightModule {}
