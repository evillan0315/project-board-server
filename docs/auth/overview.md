## Authentication Module Overview

The Authentication module is responsible for managing user authentication, authorization, and integration with external OAuth providers. It provides a secure and flexible framework for user access control within the application.

### Key Features

- **User Registration & Login:** Supports local email/password registration and login.
- **OAuth2 Integration:** Seamlessly integrates with Google and GitHub for user authentication.
- **Email Verification:** Implements an email verification flow to confirm user identities.
- **JWT Management:** Utilizes JSON Web Tokens (JWT) for secure session management and stateless authentication.
- **Role-Based Access Control (RBAC):** Enables defining and enforcing user roles to control access to specific resources and functionalities.
- **Session Management:** Handles JWT lifecycle, including generation, validation, and invalidation.

### Core Components

- [`AuthController`](./AuthController.md): Handles all HTTP API endpoints related to user authentication.
- [`AuthService`](./AuthService.md): Contains the core business logic for user authentication, registration, and JWT handling.
- [`OAuthService`](./OAuthService.md): Manages the specifics of third-party OAuth provider integrations, including profile normalization and account linking.
- [`Guards`](./Guards.md): Protects API routes and WebSocket events based on authentication status and user roles.
- [`Strategies`](./Strategies.md): Defines how Passport.js authenticates users using JWT or OAuth providers.
- [`DTOs`](./DTOs.md): Data Transfer Objects for request and response payloads related to authentication.
- [`Decorators`](./Decorators.md): Custom decorators to enhance route protection and simplify user access in controllers.

### Dependencies

The module relies on the following key dependencies:

- `@nestjs/jwt`: For JWT token creation and verification.
- `@nestjs/passport` & `passport-*` strategies: For OAuth2 and JWT authentication.
- `bcrypt`: For password hashing.
- `PrismaService`: For database interactions with the `User` and `Account` models.
- `MailService`: For sending email verification links.
- `ConfigService`: For accessing environment-specific configurations like JWT secrets and OAuth credentials.
