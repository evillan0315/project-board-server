import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { ConfigService } from '../config';
import { CustomError } from '../common/errors';

export class MailService {
  private transporter: Mail;

  constructor(private readonly configService: ConfigService) {
    this.setupTransporter();
  }

  private setupTransporter() {
    const mailUser = this.configService.get('MAIL_USER');
    const mailPass = this.configService.get('MAIL_PASS');

    if (!mailUser || !mailPass) {
      console.warn('Mail service not fully configured. Emails will not be sent. Missing MAIL_USER or MAIL_PASS.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: this.configService.get('MAIL_SERVICE') || 'gmail',
      auth: {
        user: mailUser,
        pass: mailPass,
      },
    });
  }

  async sendMail(options: Mail.Options) {
    if (!this.transporter) {
      console.error('Mail transporter is not set up. Cannot send email.');
      return;
    }

    try {
      const result = await this.transporter.sendMail({
        ...options,
        from: options.from || this.configService.get('MAIL_FROM'),
      });
      console.log('Email sent: %s', result.messageId);
      return result;
    } catch (error: any) {
      console.error('Failed to send email:', error.message, error.stack);
      throw new CustomError(`Failed to send email: ${error.message}`, 500);
    }
  }

  async sendVerificationEmail(to: string, name: string, url: string) {
    const subject = 'Verify your email for Project Planner';
    const text = `Hello ${name},

Please verify your email by clicking on this link: ${url}

Thank you,
The Project Planner Team`;
    const html = `
      <p>Hello ${name},</p>
      <p>Please verify your email by clicking on this link: <a href="${url}">${url}</a></p>
      <p>Thank you,</p>
      <p>The Project Planner Team</p>
    `;

    return this.sendMail({
      to,
      subject,
      text,
      html,
    });
  }

  async sendPasswordResetEmail(to: string, name: string, url: string) {
    const subject = 'Password Reset Request for Project Planner';
    const text = `Hello ${name},

You requested a password reset. Please click on the following link to reset your password: ${url}

If you did not request this, please ignore this email.

Thank you,
The Project Planner Team`;
    const html = `
      <p>Hello ${name},</p>
      <p>You requested a password reset. Please click on the following link to reset your password: <a href="${url}">${url}</a></p>
      <p>If you did not request this, please ignore this email.</p>
      <p>Thank you,</p>
      <p>The Project Planner Team</p>
    `;

    return this.sendMail({
      to,
      subject,
      text,
      html,
    });
  }
}
