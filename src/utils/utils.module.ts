import { Module, OnModuleInit } from '@nestjs/common';

import { UtilsController } from './utils.controller';
import { EncodingController } from './encoding.controller';
import { EncodingService } from './encoding.service';
import { HighlightCodeService } from './highlight.service';

import { JsDocToMarkdownController } from './utils-jsdoc-to-markdown.controller';
import { UtilsService } from './utils.service';
import { MarkdownUtilService } from './utils-markdown.service';
import { JsDocToMarkdownService } from './utils-jsdoc-to-markdown.service';

import { JsonToYamlDto } from './json-yaml/dto/json-to-yaml.dto';
import { YamlToJsonDto } from './json-yaml/dto/yaml-to-json.dto';
import { JsonToYamlResponseDto } from './json-yaml/dto/json-to-yaml-response.dto';
import { YamlToJsonResponseDto } from './json-yaml/dto/yaml-to-json-response.dto';

import { JsonYamlService } from './json-yaml/json-yaml.service';
import { JsonYamlController } from './json-yaml/json-yaml.controller';

HighlightCodeService;
@Module({
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
  ],
  exports: [
    EncodingService,
    UtilsService,
    JsDocToMarkdownService,
    HighlightCodeService,
  ],
})
export class UtilsModule {}
