import { Module } from '@nestjs/common';
import { GoogleGeminiLiveService } from './google-gemini-live.service';
import { ConfigModule } from '@nestjs/config';
import { ConversationModule } from '../../conversation/conversation.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { GoogleGeminiLiveController } from './google-gemini-live.controller';
import { GoogleGeminiLiveGateway } from './google-gemini-live.gateway';
import { AuthModule } from '../../auth/auth.module';
@Module({
  imports: [ConfigModule, AuthModule, ConversationModule, PrismaModule],
  providers: [GoogleGeminiLiveService, GoogleGeminiLiveGateway],
  exports: [GoogleGeminiLiveService],
  controllers: [GoogleGeminiLiveController],
})
export class GoogleGeminiLiveModule {}
