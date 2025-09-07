import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
//import { GoogleOAuthService } from './google-oauth/google-oauth.service';
import { GoogleGeminiController } from './google-gemini/google-gemini.controller';
import { GoogleGeminiService } from './google-gemini/google-gemini.service';
import { GoogleGeminiImageService } from './google-gemini/google-gemini-image.service';
import { GoogleGeminiImageController } from './google-gemini/google-gemini-image.controller';
import { GoogleGeminiTtsService } from './google-gemini/google-gemini-tts.service';
import { GoogleGeminiTtsController } from './google-gemini/google-gemini-tts.controller';
import { GoogleGeminiFileService } from './google-gemini/google-gemini-file/google-gemini-file.service';
import { GoogleGeminiFileController } from './google-gemini/google-gemini-file/google-gemini-file.controller';
import { ModuleControlModule } from '../module-control/module-control.module';
import { PrismaModule } from '../prisma/prisma.module';

import { UtilsModule } from '../utils/utils.module';

import { ConversationModule } from '../conversation/conversation.module';
import { GoogleGeminiLiveModule } from './google-gemini-live/google-gemini-live.module';
import { GoogleTranslatorModule } from './google-translator/google-translator.module'; // NEW: Import GoogleTranslatorModule
import { GoogleTranslatorController } from './google-translator/google-translator.controller'; // NEW: Import GoogleTranslatorController
import { GoogleTranslatorService } from './google-translator/google-translator.service'; // NEW: Import GoogleTranslatorService

@Module({
  imports: [
    HttpModule,
    ModuleControlModule,
    PrismaModule,
    UtilsModule,
    ConversationModule,
    GoogleGeminiLiveModule,
    GoogleTranslatorModule, // NEW: Add GoogleTranslatorModule to imports
  ],
  controllers: [
    GoogleGeminiController,
    GoogleGeminiImageController,
    GoogleGeminiTtsController,
    GoogleGeminiFileController,
    GoogleTranslatorController, // NEW: Add GoogleTranslatorController to controllers
  ],
  providers: [
    //GoogleOAuthService,
    GoogleGeminiService,
    GoogleGeminiImageService,
    GoogleGeminiTtsService,
    GoogleGeminiFileService,
    GoogleTranslatorService, // NEW: Add GoogleTranslatorService to providers
  ],
  exports: [GoogleGeminiService, GoogleGeminiFileService, GoogleTranslatorService], // NEW: Export GoogleTranslatorService if needed by other modules
})
export class GoogleModule {}
