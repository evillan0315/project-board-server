import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import * as express from 'express';
import { join } from 'path';
import { Logger } from '@nestjs/common';
import * as hbs from 'hbs';
import { registerHandlebarsHelpers } from './common/helpers/hbs-helpers';
import { writeFileSync } from 'fs';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const allowedOrigins = [
    'https://board-api.duckdns.org',
    'http://localhost:5000',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173',
  ];
  const downloadDir = path.resolve(process.cwd(), 'downloads');
  const configService = app.get(ConfigService);
  const NODE_ENV = configService.get<string>('NODE_ENV') || 'development';
  const port = configService.get<number>('PORT', 5000);
  const base_url =
    configService.get<string>('BASE_URL') || `http://localhost:${port}`;
  const swaggerEnabled = configService.get<boolean>('SWAGGER_ENABLED') || false;
  // --- ADD THIS SECTION TO INCREASE PAYLOAD LIMIT ---
  // Increase payload size limit for JSON bodies (e.g., to 50MB)
  // Adjust '50mb' as needed based on your application's requirements.
  app.use(express.json({ limit: '50mb' }));

  // If you also handle URL-encoded data, increase its limit too
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  // Set default layout
  app.set('view options', {
    layout: 'layouts/main',
  });
  app.setBaseViewsDir(join(__dirname, '..', 'views')); // For runtime
  app.setViewEngine('hbs');
  console.log(
    'Registering partials from:',
    join(__dirname, '..', 'views/partials'),
  );

  hbs.registerHelper('log', (message) => {});
  registerHandlebarsHelpers();
  
  app.use(cookieParser());
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.error(`Blocked by CORS: ${origin}`); // Debugging
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useStaticAssets(join(__dirname, '..', '..', 'downloads'), {
    prefix: '/api/media/',
  });
  hbs.registerPartials(join(__dirname, '..', 'views/partials'));
  app.useStaticAssets(join(__dirname, '..', '..', 'public'), {
    prefix: '/public/', // Optional: accessed via http://localhost:3000/public/
  });
  if (swaggerEnabled && NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('API Server')
      .setDescription('Authentication and Role Protected APIs')
      .setVersion('1.0')
      .addTag('Auth')
      .addBearerAuth(
        {
          description: 'Enter JWT token in the format: Bearer <token>',
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        'bearer', // name for the security scheme
      )
      .addCookieAuth('jwt', {
        type: 'apiKey',
        in: 'cookie',
        name: 'jwt',
        description: 'JWT stored in cookie (for web clients)',
      })
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    // Optionally write the spec to file
    writeFileSync('./swagger.json', JSON.stringify(document, null, 2));

    SwaggerModule.setup('api', app, document);
    console.log('🥞 Swagger is enabled at /api');
  } else {
    console.log('🚫 Swagger is disabled in production.');
  }
  // Graceful shutdown setup
  app.enableShutdownHooks(); // Handle graceful shutdown
  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
