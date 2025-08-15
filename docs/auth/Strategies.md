## Passport Strategies

Passport strategies define how authentication is performed within the application for different authentication mechanisms (JWT, Google OAuth, GitHub OAuth).

### `JwtStrategy`

- **Purpose:** Validates JSON Web Tokens (JWTs) presented by clients to authenticate API requests.
- **Extends:** `PassportStrategy(Strategy, 'jwt')` from `passport-jwt`.
- **Token Source:** Configured to extract the JWT from:
  - HTTP `accessToken` cookies.
  - WebSocket handshake `accessToken` cookies.
  - `Authorization: Bearer <token>` HTTP headers.
- **Validation:** It verifies the token's signature and expiration. If valid, it uses `AuthService.validateUser` to fetch the complete user profile from the database based on the `sub` (subject/user ID) claim in the JWT payload.
- **Dependencies:** `ConfigService` (for `JWT_SECRET`), `AuthService`.

### `GoogleStrategy`

- **Purpose:** Authenticates users via Google's OAuth2 provider.
- **Extends:** `PassportStrategy(Strategy, 'google')` from `passport-google-oauth20`.
- **Configuration:** Configured with `clientID`, `clientSecret`, `callbackURL`, and `scope` (email, profile) from environment variables.
- **Validation:** Receives `accessToken`, `refreshToken`, and the `profile` object from Google. It then constructs typed [`GoogleProfileDto`](./DTOs.md) and [`GoogleTokenDto`](./DTOs.md) objects and passes them to the callback, where `AuthService` (via `OAuthService`) handles user creation/login.

### `GitHubStrategy`

- **Purpose:** Authenticates users via GitHub's OAuth2 provider.
- **Extends:** `PassportStrategy(Strategy, 'github')` from `passport-github2`.
- **Configuration:** Configured with `clientID`, `clientSecret`, `callbackURL`, and `scope` (`user:email`) from environment variables.
- **Validation:** Receives `accessToken`, `refreshToken`, and the `profile` object from GitHub. It constructs typed [`GitHubProfileDto`](./DTOs.md) and [`GitHubTokenDto`](./DTOs.md) objects and passes them to the callback, where `AuthService` (via `OAuthService`) handles user creation/login.
