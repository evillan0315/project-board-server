## Authentication Data Transfer Objects (DTOs)

DTOs define the structure of data payloads for requests and responses within the authentication module. They are used for validation, clarity, and API documentation (Swagger).

### `RegisterDto`

Used for user registration requests.

- `email`: `string` (required) - User's email address.
- `password`: `string` (required) - User's password (min 8 characters).
- `name`: `string` (optional) - User's full name.
- `phone_number`: `string` (optional) - User's phone number.
- `role`: `UserRole` (optional, default: `USER`) - User's assigned role.

### `LoginDto`

Used for user login requests.

- `email`: `string` (required) - User's email address.
- `password`: `string` (required) - User's password.

### `CreateJwtUserDto`

Defines the structure of the payload that is embedded within a JWT.

- `id`: `string` (optional) - Internal user ID.
- `sub`: `string` (required) - Subject of the token, typically the user's ID.
- `email`: `string` (required) - User's email.
- `name`: `string` (optional) - User's name.
- `phone_number`: `string` (optional) - User's phone number.
- `role`: `Role` (required) - User's role.
- `image`: `string` (optional) - URL to user's profile image.
- `provider`: `string` (optional) - OAuth provider (e.g., 'google', 'github').
- `tokens`: `any` (optional) - OAuth tokens (should ideally be more specific).
- `username`: `any` (optional) - User's username (e.g., GitHub login).

### `VerifyEmailDto`

Used for email verification requests (query parameters).

- `token`: `string` (required) - The JWT verification token sent to the user's email.

### `EmailVerificationResponseDto`

Response structure for email verification actions.

- `message`: `string` - A success or informational message.

### `GoogleProfileDto`

Represents the structured user profile received from Google OAuth2.

- `id`: `string` - Google user ID.
- `displayName`: `string` (optional) - User's display name.
- `name`: `{ familyName?: string; givenName?: string; }` (optional) - Structured name.
- `emails`: `Array<{ value: string; verified?: boolean; }>` (optional) - Array of email addresses.
- `photos`: `Array<{ value: string; }>` (optional) - Array of photo URLs.
- `provider`: `string` (optional, usually 'google') - OAuth provider.

### `GoogleTokenDto`

Represents the token information received from Google OAuth2.

- `accessToken`: `string` - Google access token.
- `refreshToken`: `string` (optional) - Google refresh token.
- `idToken`: `string` (optional) - Google ID token.
- `expiresAt`: `number` (optional) - Unix timestamp when access token expires.
- `scope`: `string` (optional) - Scopes granted.
- `tokenType`: `string` (optional, usually 'Bearer') - Type of token.

### `GitHubProfileDto`

Represents the structured user profile received from GitHub OAuth2.

- `id`: `string` - GitHub user ID.
- `login`: `string` - GitHub username/login.
- `name`: `string` (optional) - User's full name.
- `email`: `string` (optional) - User's email address.
- `avatar_url`: `string` (optional) - URL to user's avatar image.
- `provider`: `string` (optional, usually 'github') - OAuth provider.

### `GitHubTokenDto`

Represents the token information received from GitHub OAuth2.

- `accessToken`: `string` - GitHub access token.
- `refreshToken`: `string` (optional) - GitHub refresh token.
- `scope`: `string` (optional) - Scopes granted.
- `tokenType`: `string` (optional) - Type of token.
