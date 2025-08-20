// src/resume/resume.module.ts (Example)
import { Module } from '@nestjs/common';
import { ResumeParserService } from './resume-parser.service';
import { ResumeController } from './resume.controller';
import { UserModule } from '../user/user.module';
import { GoogleModule } from '../google/google.module';

@Module({
  imports: [GoogleModule, UserModule], 
  providers: [ResumeParserService],
  controllers: [ResumeController],
  exports: [ResumeParserService], 
})
export class ResumeModule {}
