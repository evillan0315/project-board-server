# Mail Module

The `mail` module is responsible for sending transactional emails from the Project Planner Server, such as email verification links and password reset instructions. It utilizes `nodemailer` for email delivery.

## Service

### `MailService` (`src/mail/mail.service.ts`)
Manages the configuration and sending of emails through an SMTP transporter.

**Key Responsibilities:**
-   Configures `nodemailer` transporter based on environment variables (`MAIL_SERVICE`, `MAIL_USER`, `MAIL_PASS`).
-   Provides helper methods for sending specific types of emails (verification, password reset).
-   Includes error handling for email sending failures.
-   Gracefully handles cases where mail service credentials are not fully configured.

**Key Methods:**
-   `constructor(configService: ConfigService)`: Initializes the `MailService` and sets up the `nodemailer` transporter. It warns if mail credentials are missing.
-   `sendMail(options: Mail.Options)`: A generic method to send an email with custom options. It automatically sets the `from` address from `MAIL_FROM` if not specified.
-   `sendVerificationEmail(to: string, name: string, url: string)`: Sends an email with a link to verify the user's email address.
-   `sendPasswordResetEmail(to: string, name: string, url: string)`: Sends an email containing a link for the user to reset their password.

## Configuration

The `MailService` relies on the following environment variables (managed by `ConfigService`):

-   `MAIL_SERVICE`: (e.g., 'gmail', 'SendGrid', etc.) Specifies the email service provider.
-   `MAIL_USER`: The username (email address) for the mail service.
-   `MAIL_PASS`: The password or app-specific password for the mail service.
-   `MAIL_FROM`: The default "from" address to be used in outgoing emails.

**Note:** If `MAIL_USER` or `MAIL_PASS` are not provided, the `MailService` will log a warning and email functionalities will be disabled to prevent crashes from misconfiguration.