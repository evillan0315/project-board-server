## Mail Module Overview

The `MailModule` provides a centralized and configurable service for sending emails within the application. It leverages `@nestjs-modules/mailer` with a Handlebars adapter for template rendering, enabling dynamic and well-formatted email communications such as email verification and password reset notifications.

### Key Features

- **Configurable SMTP Transport:** Easily switch between different email services (defaulting to Gmail via App Password) through environment variables.
- **Handlebars Templates:** Utilizes Handlebars (`.hbs` files) for flexible and maintainable email content, allowing dynamic data injection.
- **Email Sending Abstraction:** Provides a simple API (`MailService`) for triggering various types of emails without needing to manage `nodemailer` directly.
- **Integration with Configuration:** Seamlessly integrates with `@nestjs/config` for secure management of email credentials and sender details.

### Configuration

The `MailModule` is configured asynchronously using `ConfigService` to load settings from environment variables. Key environment variables include:

- `MAIL_SERVICE`: The SMTP service provider (e.g., `gmail`).
- `MAIL_USER`: The email address used for authentication.
- `MAIL_PASS`: The application-specific password (for services like Gmail App Passwords) or the regular password.
- `MAIL_FROM`: The default sender address, including a display name (e.g., `"Project Board" <sender@example.com>`).

**Example `.env` configuration:**

```env
MAIL_SERVICE=gmail
MAIL_FROM='"Project Board" <your-gmail-account@gmail.com>'
MAIL_USER=your-gmail-account@gmail.com
MAIL_PASS=your-gmail-app-password
```

### Components

- [`MailService`](./MailService.md): The primary service for sending emails.

### Dependencies

The module depends on:

- `@nestjs-modules/mailer`: The core library for email sending.
- `@nestjs/config`: For loading environment-specific email settings.
- `HandlebarsAdapter`: For rendering email templates.

### Usage

To send emails, inject `MailService` into your desired service or controller and call the appropriate sending method:

```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UserService {
  constructor(private readonly mailService: MailService) {}

  async registerUser(email: string, name: string, verificationLink: string) {
    // ... user creation logic ...
    await this.mailService.sendVerificationEmail(email, name, verificationLink);
  }
}
```
