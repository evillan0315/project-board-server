# Authentication Module

The `auth` module provides robust user authentication, authorization, and OAuth capabilities for the Project Planner Server. It integrates with Passport.js for strategy management, bcrypt for password hashing, and JWT for secure token-based authentication.

## Services

### `AuthService` (`src/auth/auth.service.ts`)
The central service for all authentication-related business logic.

**Key Responsibilities:**
-   User registration and login.
-   Password hashing and comparison.
-   JWT generation for access and email verification tokens.
-   Email verification flow.
-   Password reset flow (token generation, email sending, password update).
-   Delegation to `OAuthService` for third-party authentication.
-   User validation for JWT strategy.

**Key Methods:**
-   `login(dto: LoginDto)`: Authenticates a user with email and password, returns JWT tokens.
-   `register(dto: RegisterDto)`: Registers a new user, hashes password, sends verification email, returns JWT.
-   `verifyEmail(token: string)`: Verifies user's email using a token.
-   `resendVerification(email: string)`: Sends a new email verification link.
-   `requestPasswordReset(email: string)`: Initiates password reset, sends a tokenized link to the user's email.
-   `resetPassword(token: string, newPassword: string)`: Resets user's password using a valid token.
-   `validateUser(userId: string)`: Fetches user details by ID for JWT deserialization.
-   `validateOAuthProfile(provider: 'google' | 'github', profile, tokens)`: Validates and processes OAuth profiles, delegating to `OAuthService`.
-   `generateToken(payload: CreateJwtUserDto)`: Generates a new JWT access token.
-   `validateToken(token: string)`: Validates a JWT access token and returns its payload.

---

### `OAuthService` (`src/auth/oauth.service.ts`)
Handles the logic specific to third-party OAuth providers (Google, GitHub).

**Key Responsibilities:**
-   Normalizes profile data received from different OAuth providers into a consistent format.
-   Manages user creation or linking based on OAuth profiles.
-   Persists OAuth account details (access tokens, refresh tokens) in the database.

**Key Methods:**
-   `validate(provider, profile, tokens)`: Main entry point for OAuth validation. Normalizes the profile and handles login/registration.
-   `normalizeProfile(provider, profile)`: Extracts common user data (email, name, image) from provider-specific profile objects.
-   `handleOAuthLogin(provider, profile, tokens)`: Finds or creates a user, then upserts their associated OAuth account information.

## Strategies

The `auth/strategies` directory contains Passport.js strategies for different authentication methods.

-   **`google.strategy.ts`**: Implements `passport-google-oauth20` to handle Google OAuth login. It defines the client ID, client secret, and callback URL, and maps the Google profile data to an internal DTO.
-   **`github.strategy.ts`**: Implements `passport-github2` to handle GitHub OAuth login. Similar to Google, it configures client details and processes the GitHub profile.
-   **JWT Strategy (defined in `auth.router.ts`)**: A custom JWT strategy is implemented directly within `auth.router.ts` using `passport-jwt`. It extracts the JWT from either cookies (`accessToken`) or the `Authorization` header and validates it against the `JWT_SECRET` to retrieve user information from the database.

## Types and DTOs (`src/auth/types.ts`)

This file defines all relevant TypeScript interfaces and Data Transfer Objects (DTOs) used within the authentication module, along with Zod schemas for validation.

**Key Types:**
-   `RegisterDto`, `LoginDto`: Payloads for user registration and login.
-   `CreateJwtUserDto`: Structure for the user data embedded in JWTs.
-   `ForgotPasswordDto`, `ResetPasswordDto`, `VerifyEmailDto`: Payloads for password reset and email verification.
-   `GoogleProfileDto`, `GitHubProfileDto`: Raw profile structures from OAuth providers.
-   `GoogleTokenDto`, `GitHubTokenDto`: Token structures from OAuth providers.
-   `OAuthProfile`, `OAuthTokens`: Normalized interfaces for OAuth data.
-   `JwtPayload`: The structure of the decoded JWT payload.

**Zod Schemas:**
-   `RegisterSchema`, `LoginSchema`, `ForgotPasswordSchema`, `ResetPasswordSchema`, `VerifyEmailSchema`: Used for validating incoming request bodies/query parameters to ensure data integrity and security.

## API Endpoints (`/auth`)

The authentication module exposes the following endpoints (defined in `src/auth/auth.router.ts`):

-   `POST /auth/register`: Register a new user with email, password, and optional details.
-   `POST /auth/login`: Authenticate a user with email and password. Returns JWTs.
-   `POST /auth/logout`: Clears the authentication cookie, effectively logging out the user.
-   `GET /auth/google`: Initiates the Google OAuth login flow.
-   `GET /auth/google/callback`: The callback URL for Google OAuth, handles successful authentication and redirects.
-   `GET /auth/github`: Initiates the GitHub OAuth login flow.
-   `GET /auth/github/callback`: The callback URL for GitHub OAuth, handles successful authentication and redirects.
-   `POST /auth/resend-verification`: Requests a new email verification link to be sent.
-   `GET /auth/verify-email`: Verifies a user's email address using a token from the verification link.
-   `POST /auth/forgot-password`: Requests a password reset link for a given email.
-   `POST /auth/reset-password`: Resets the user's password using a provided token and new password.
-   `GET /auth/me`: Retrieves the details of the currently authenticated user (requires a valid JWT).