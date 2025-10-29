## MailService

`MailService` provides a convenient interface for sending various types of templated emails through the configured `MailerModule`. It abstracts away the complexities of the underlying email transport and template rendering.

### Dependencies

- `MailerService`: Injected from `@nestjs-modules/mailer` to handle the actual email transmission.
- `ConfigService`: Injected from `@nestjs/config` to retrieve email configuration parameters (e.g., sender address).

### Methods

#### `sendVerificationEmail(to: string, name: string, verificationLink: string): Promise<void>`

Sends an email to a user for account verification. This email typically contains a link that the user must click to activate their account.

- **Parameters:**
  - `to`: `string` - The recipient's email address.
  - `name`: `string` - The recipient's name, used to personalize the email template.
  - `verificationLink`: `string` - The unique URL that the user needs to click to verify their email address.

- **Template Used:** `welcome.hbs` (located in `views/mail/welcome.hbs`).

- **Throws:**
  - `Error`: If the email sending process fails, an error is logged, and a new error is thrown to indicate the failure.

#### `sendPasswordResetEmail(to: string, name: string, resetLink: string): Promise<void>`

Sends an email to a user containing a link to reset their password. This is typically sent in response to a 'forgot password' request.

- **Parameters:**
  - `to`: `string` - The recipient's email address.
  - `name`: `string` - The recipient's name, used to personalize the email template.
  - `resetLink`: `string` - The unique URL that the user needs to click to initiate the password reset process.

- **Template Used:** `password-reset.hbs` (located in `views/mail/password-reset.hbs`).

- **Throws:**
  - `Error`: If the email sending process fails, an error is logged, and a new error is thrown to indicate the failure.
