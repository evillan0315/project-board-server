// src/resume/resume.module.ts (Example)
import { Module } from '@nestjs/common';
import { ResumeParserService } from './resume-parser.service';
import { ResumeController } from './resume.controller';
// Make sure this path is correct for your GoogleGeminiModule
import { GoogleModule } from '../google/google.module';

@Module({
  imports: [GoogleModule], // Import GoogleGeminiModule if ResumeController uses GoogleGeminiFileService
  providers: [ResumeParserService],
  controllers: [ResumeController],
  exports: [ResumeParserService], // Export if other modules might need to inject ResumeParserService
})
export class ResumeModule {}
