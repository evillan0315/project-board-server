## OAuthService

`OAuthService` is dedicated to handling the intricacies of OAuth provider integrations. It normalizes user profile data received from different providers (like Google and GitHub) and manages the creation or updating of user accounts and their linked `Account` entries in the database.

### Dependencies

- `PrismaService`: For all database operations, specifically interacting with the `User` and `Account` models.

### Methods

#### `validate(provider: 'google' | 'github', profile: GoogleProfileDto | GitHubProfileDto, tokens: GoogleTokenDto | GitHubTokenDto): Promise<User>`

The primary entry point for OAuth profile validation. It normalizes the provider-specific profile and then calls `handleOAuthLogin` to manage the database entry.

- **Parameters:**
  - `provider`: `'google' | 'github'` - The name of the OAuth provider.
  - `profile`: [`GoogleProfileDto`](./DTOs.md) | [`GitHubProfileDto`](./DTOs.md) - The raw profile data from the OAuth provider.
  - `tokens`: [`GoogleTokenDto`](./DTOs.md) | [`GitHubTokenDto`](./DTOs.md) - The access and refresh tokens from the OAuth provider.
- **Returns:** The `User` object (either an existing user found by email or a newly created user).
- **Throws:** `Error` if the normalized profile does not contain a valid email address.

#### `normalizeProfile(provider: 'google' | 'github', profile: GoogleProfileDto | GitHubProfileDto): OAuthProfile`

Converts a provider-specific profile object (e.g., `GoogleProfileDto` or `GitHubProfileDto`) into a common `OAuthProfile` interface. This ensures consistency in how user data from various OAuth sources is processed.

- **Parameters:**
  - `provider`: `'google' | 'github'` - The name of the OAuth provider.
  - `profile`: [`GoogleProfileDto`](./DTOs.md) | [`GitHubProfileDto`](./DTOs.md) - The raw profile data.
- **Returns:** A normalized `OAuthProfile` object.
- **Throws:** `Error` if the profile lacks a required email.

#### `handleOAuthLogin(provider: 'google' | 'github', profile: OAuthProfile, tokens: OAuthTokens): Promise<User>`

Manages the user and account records in the database based on the normalized OAuth profile.

- **Logic:**
  1.  Attempts to find an existing user by their email address.
  2.  If the user does not exist, a new `User` record is created with `emailVerified` set to the current date and a default `USER` role.
  3.  If the user exists but lacks an `image` or `username` and the OAuth profile provides one, the user record is updated.
  4.  An `Account` record is created or updated. This record links the user's internal ID to their external OAuth provider ID and stores the associated tokens (access, refresh, ID tokens, etc.). This ensures that multiple OAuth accounts can be linked to a single internal user.

- **Parameters:**
  - `provider`: `'google' | 'github'` - The name of the OAuth provider.
  - `profile`: `OAuthProfile` - The normalized user profile.
  - `tokens`: `OAuthTokens` - The normalized tokens from the OAuth provider.
- **Returns:** The `User` object (either the existing one or the newly created one).
