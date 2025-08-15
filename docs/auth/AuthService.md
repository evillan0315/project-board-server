## AuthService

`AuthService` encapsulates the core business logic for user authentication, registration, email verification, and interaction with OAuth providers.

### Dependencies

- `PrismaService`: For all database operations related to users and accounts.
- `JwtService`: For signing and verifying JSON Web Tokens.
- `MailService`: For sending email verification and other user-related emails.
- `OAuthService`: Delegates the specific logic for handling OAuth profiles and creating/updating user accounts linked to third-party providers.

### Methods

#### `login(dto: LoginDto): Promise<{ accessToken: string; user: any }>`

Authenticates a user by verifying their email and password against the database. If successful, a JWT access token is generated.

- **Parameters:**
  - `dto`: [`LoginDto`](./DTOs.md) - Contains the user's email and password.
- **Throws:**
  - `UnauthorizedException`: If credentials are invalid.

#### `register(dto: RegisterDto): Promise<{ message: string }>`

Registers a new user, hashes their password, and sends an email verification link. A `USER` role is assigned by default.

- **Parameters:**
  - `dto`: [`RegisterDto`](./DTOs.md) - Contains user registration details.
- **Throws:**
  - `InternalServerErrorException`: If user creation fails in the database.

#### `verifyEmail(token: string): Promise<{ message: string }>`

Verifies a user's email address using a JWT verification token received via email. Updates the `emailVerified` timestamp in the database.

- **Parameters:**
  - `token`: `string` - The JWT email verification token.
- **Throws:**
  - `BadRequestException`: If the token is invalid or expired.

#### `resendVerification(email: string): Promise<{ message: string }>`

Generates and resends an email verification link to a user. Useful if the initial link expired or was not received.

- **Parameters:**
  - `email`: `string` - The email address of the user.
- **Throws:**
  - `NotFoundException`: If no user is found with the given email.

#### `validateUser(userId: string): Promise<User | null>`

Retrieves a user's profile information based on their ID. Used by `JwtStrategy` to load the authenticated user.

- **Parameters:**
  - `userId`: `string` - The ID of the user.
- **Returns:** A `User` object or `null` if not found.

#### `validateOAuthProfile(provider: 'google' | 'github', profile: GoogleProfileDto | GitHubProfileDto, tokens: GoogleTokenDto | GitHubTokenDto): Promise<User>`

Delegates to `OAuthService` to process and validate a user's profile obtained from an OAuth provider (Google or GitHub). This method is crucial for handling sign-up/sign-in flows via social logins.

- **Parameters:**
  - `provider`: `'google' | 'github'` - The name of the OAuth provider.
  - `profile`: [`GoogleProfileDto`](./DTOs.md) | [`GitHubProfileDto`](./DTOs.md) - The raw profile data from the OAuth provider.
  - `tokens`: [`GoogleTokenDto`](./DTOs.md) | [`GitHubTokenDto`](./DTOs.md) - The access and refresh tokens from the OAuth provider.
- **Returns:** The `User` object (either existing or newly created).

#### `generateToken(payload: CreateJwtUserDto): Promise<string>`

Creates a new JWT token signed with the application's secret. The token contains the provided payload (user information).

- **Parameters:**
  - `payload`: [`CreateJwtUserDto`](./DTOs.md) - The data to embed within the JWT.
- **Returns:** The generated JWT `string`.
