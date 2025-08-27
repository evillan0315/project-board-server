import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('NestApplication');

  // Get frontend URL from config
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  if (!frontendUrl) {
    logger.error('FRONTEND_URL environment variable is not set. CORS might not work correctly.');
    // Exit or throw if frontendUrl is critical
  }

  // Configure CORS for HTTP endpoints
  app.enableCors({
    origin: frontendUrl || 'http://localhost:5173', // Allow specific frontend origin or fallback for development
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Configure WebSocket CORS (IoAdapter handles this for Socket.IO)
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`WebSocket Gateway is listening on: ws://localhost:${port}/gemini`);
}
bootstrap();
