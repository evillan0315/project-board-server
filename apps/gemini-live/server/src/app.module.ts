import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { GeminiModule } from './gemini/gemini.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        FRONTEND_URL: Joi.string().uri().required(),
        GOOGLE_API_KEY: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
      }),
      envFilePath: '.env',
    }),
    AuthModule,
    GeminiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
