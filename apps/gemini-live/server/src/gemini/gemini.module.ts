import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { GeminiGateway } from './gemini.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // Import AuthModule to use JwtStrategy and WsJwtGuard
  providers: [GeminiService, GeminiGateway],
  exports: [GeminiService], // Export if other modules need to interact with Gemini sessions
})
export class GeminiModule {}
