import { Module, OnModuleInit } from '@nestjs/common';

import { UtilsController } from './utils.controller';
import { EncodingController } from './encoding.controller';
import { EncodingService } from './encoding.service';
import { HighlightCodeService } from './highlight.service';
import { ModuleControlModule } from '../module-control/module-control.module';
import { JsDocToMarkdownController } from './utils-jsdoc-to-markdown.controller';
import { UtilsService } from './utils.service';
import { MarkdownUtilService } from './utils-markdown.service';
import { JsDocToMarkdownService } from './utils-jsdoc-to-markdown.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JsonToYamlDto } from './json-yaml/dto/json-to-yaml.dto';
import { YamlToJsonDto } from './json-yaml/dto/yaml-to-json.dto';
import { JsonToYamlResponseDto } from './json-yaml/dto/json-to-yaml-response.dto';
import { YamlToJsonResponseDto } from './json-yaml/dto/yaml-to-json-response.dto';
import { JsonYamlService } from './json-yaml/json-yaml.service';
import { JsonFixService } from './json-fix.service';
import { JsonYamlController } from './json-yaml/json-yaml.controller';
import { GoogleGeminiFileService } from '../google/google-gemini/google-gemini-file/google-gemini-file.service';
import { ConversationService } from '../conversation/conversation.service';

@Module({
  imports: [
    // 👇 Import the module that provides ModuleControlService
    PrismaModule,
    ModuleControlModule,
  ],
  controllers: [
    UtilsController,
    EncodingController,
    JsDocToMarkdownController,
    JsonYamlController,
  ],
  providers: [
    EncodingService,
    UtilsService,
    MarkdownUtilService,
    JsDocToMarkdownService,
    JsonYamlService,
    HighlightCodeService,
    JsonFixService,
    GoogleGeminiFileService,
    ConversationService,
  ],
  exports: [
    EncodingService,
    UtilsService,
    JsDocToMarkdownService,
    HighlightCodeService,
    JsonFixService,
  ],
})
export class UtilsModule {}
