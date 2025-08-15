import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LlmController } from './llm.controller';
import { GoogleModule } from '../google/google.module';
import { FileModule } from '../file/file.module';
import { ModuleControlModule } from '../module-control/module-control.module';
import { UtilsModule } from '../utils/utils.module';
@Module({
  imports: [
    GoogleModule,
    ModuleControlModule,
    FileModule,
    UtilsModule
  ],
  providers: [LlmService],
  controllers: [LlmController]
})
export class LlmModule {}
