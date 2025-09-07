import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GoogleTranslatorService } from './google-translator.service';
import { GoogleTranslatorController } from './google-translator.controller';

@Module({
  imports: [HttpModule], // HttpModule is required by GoogleTranslatorService
  controllers: [GoogleTranslatorController],
  providers: [GoogleTranslatorService],
  exports: [GoogleTranslatorService], // Export service if it needs to be injected into other modules
})
export class GoogleTranslatorModule {}
