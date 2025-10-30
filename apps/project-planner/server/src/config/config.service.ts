import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  BASE_URL: z.string().url().default('http://localhost:4000'),

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(1),
  JWT_VERIFICATION_SECRET: z.string().min(1),
  JWT_VERIFICATION_EXPIRES_IN: z.string().min(1).default('1h'),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),

  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_CALLBACK_URL: z.string().url(),

  GOOGLE_GEMINI_API_KEY: z.string().min(1),
  GOOGLE_GEMINI_MODEL: z.string().min(1).default('gemini-1.5-flash'),

  OPENAI_API_KEY: z.string().optional(),

  BASE_DIR: z.string().optional().default(process.cwd()),

  MAIL_SERVICE: z.string().optional(),
  MAIL_USER: z.string().email().optional(),
  MAIL_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
});

export class ConfigService {
  private readonly envConfig: z.infer<typeof configSchema>;

  constructor() {
    try {
      this.envConfig = configSchema.parse(process.env);
    } catch (error) {
      console.error('Environment variable validation error:', error.flatten());
      throw new Error('Missing or invalid environment variables.');
    }
  }

  get<T extends keyof typeof this.envConfig>(key: T): (typeof this.envConfig)[T] {
    return this.envConfig[key];
  }

  getVariables() {
    return this.envConfig;
  }
}
