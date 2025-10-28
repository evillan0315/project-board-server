/**
 * FilePath: src/mail/mail.module.ts
 * Title: MailerModule configuration for Gmail App Password
 * Reason: Configures @nestjs-modules/mailer to use Gmail SMTP authentication via App Password and Handlebars templates
 */
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          service: configService.get<string>('MAIL_SERVICE') || 'gmail',
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASS'), // App Password, not OAuth2
          },
        },
        defaults: {
          from: configService.get<string>('MAIL_FROM') || `"Support" <${configService.get<string>('MAIL_USER')}>`,
        },
        template: {
          dir: join(__dirname, '../../views/mail'),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}

