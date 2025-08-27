import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: this.configService.get<string>('MAIL_SECURE') === 'true', // Use 'true' for 465, 'false' for other ports
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
      // Optional: Add TLS options if needed, especially for self-signed certs or specific configurations
      tls: {
        rejectUnauthorized: this.configService.get<string>('MAIL_REJECT_UNAUTHORIZED') !== 'false',
      },
    });
  }

  async sendVerificationEmail(to: string, name: string, verificationLink: string) {
    const mailOptions = {
      from: this.configService.get<string>('MAIL_FROM'),
      to: to,
      subject: 'Verify Your Email Address',
      html: `
        <p>Hello ${name},</p>
        <p>Thank you for registering with our service. Please verify your email address by clicking on the link below:</p>
        <p><a href="${verificationLink}">Verify Email</a></p>
        <p>If you did not register for this service, please ignore this email.</p>
        <p>Best regards,</p>
        <p>The Team</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
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
      to: to,
      subject: 'Password Reset Request',
      html: `
        <p>Hello ${name},</p>
        <p>You have requested to reset your password. Please click on the link below to reset your password:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>This link is valid for 1 hour. If you did not request a password reset, please ignore this email.</p>
        <p>Best regards,</p>
        <p>The Team</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
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
