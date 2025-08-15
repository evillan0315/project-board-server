// src/file/file-language-service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as prettier from 'prettier';
import { LanguageMap } from '../types/file.types';
import { UtilsService } from '../utils/utils.service';

@Injectable()
export class FileLanguageService {
  private readonly extensionLanguageMap: LanguageMap;
  private readonly mimeLanguageMap: LanguageMap;
  private readonly parserMap: Record<
    string,
    prettier.BuiltInParserName | string
  >;

  constructor(
    private readonly configService: ConfigService,
    private readonly utilsService: UtilsService,
  ) {
    this.extensionLanguageMap = this.utilsService.parseEnvMap(
      this.configService.get('EXTENSION_LANGUAGE_MAP'),
    );
    this.mimeLanguageMap = this.utilsService.parseEnvMap(
      this.configService.get('MIME_LANGUAGE_MAP'),
    );
    this.parserMap = this.utilsService.parseEnvMap(
      this.configService.get('PARSER_LANGUAGE_MAP'),
    );
  }

  getLanguageByExtension(ext: string): string | undefined {
    return this.extensionLanguageMap[ext];
  }

  getLanguageByMime(mime: string): string | undefined {
    return this.mimeLanguageMap[mime];
  }

  getPrettierParser(
    lang: string,
  ): prettier.BuiltInParserName | string | undefined {
    return this.parserMap[lang];
  }
}
