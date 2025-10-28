/**
 * FilePath: src/mail/mail.service.ts
 * Title: NestJS MailService using Gmail App Password with Handlebars templates
 * Reason: Provides email verification and password reset functionality via Gmail SMTP with @nestjs-modules/mailer
 */
import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendVerificationEmail(to: string, name: string, verificationLink: string) {
    const mailOptions = {
      from: this.configService.get<string>('MAIL_FROM'),
      to,
      subject: 'Verify Your Email Address',
      template: 'welcome', // points to templates/welcome.hbs
      context: { name, verificationLink },
    };

    try {
      await this.mailerService.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${to}: ${error.message}`,
        error.stack,
      );
      throw new Error('Failed to send verification email.');
    }
  }

  async sendPasswordResetEmail(to: string, name: string, resetLink: string) {
    const mailOptions = {
      from: this.configService.get<string>('MAIL_FROM'),
      to,
      subject: 'Password Reset Request',
      template: 'password-reset', // points to templates/password-reset.hbs
      context: { name, resetLink },
    };

    try {
      await this.mailerService.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${to}: ${error.message}`,
        error.stack,
      );
      throw new Error('Failed to send password reset email.');
    }
  }
}

