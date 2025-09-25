import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(bodyParser.json({ limit: '1mb' }));
  await app.listen(3000);
  console.log('🚀 Nest demo running at http://localhost:3000');
}
bootstrap();
