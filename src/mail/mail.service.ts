import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}
  private verificationEmail(email: string, name: string, url?: string) {
    const htmlContent = `
    <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Email Verification</title>
  </head>
  <body>
     <h1>Welcome, ${name ?? 'Registered user'}!</h1>
    <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
    <p><a href="${url}">Verify Email</a></p>
    <p>This link will expire in 24 hours.</p>
  </body>
</html>`;
    return htmlContent;
  }
  async sendVerificationEmail(
    email: string,
    name: string,
    url: string,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify your email address',
      html: this.verificationEmail(email, name, url),
      context: {
        email,
        name: name ?? 'Registered user',
        url,
      },
    });
  }
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const htmlContent = `
    <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Email Verification</title>
  </head>
  <body>
     <h1>Welcome, ${email ?? 'Registered user'}!</h1>
    <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
    <p><a href="${name}">Verify Email</a></p>
    <p>This link will expire in 24 hours.</p>
  </body>
</html>`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Verification email link',
      html: this.verificationEmail(email, name),
      context: {
        email,
        name,
      },
    });
  }
}
