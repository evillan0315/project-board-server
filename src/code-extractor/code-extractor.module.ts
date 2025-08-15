// src/code-extractor/code-extractor.module.ts
import { Module } from '@nestjs/common';
import { CodeExtractorService } from './code-extractor.service';
import { CodeExtractorController } from './code-extractor.controller';

@Module({
  controllers: [CodeExtractorController],
  providers: [CodeExtractorService],
})
export class CodeExtractorModule {}
