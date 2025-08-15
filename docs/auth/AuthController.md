## AuthController

`AuthController` is responsible for handling all HTTP requests related to user authentication and authorization. It provides endpoints for local user registration and login, as well as OAuth2 integrations with Google and GitHub.

### Endpoints

All endpoints are prefixed with `/api/auth`.

#### `POST /login`

- **Summary:** Log in a user and set JWT cookie.
- **Description:** Authenticates a user with provided email and password. If successful, an `accessToken` cookie is set, and user details are returned.
- **Request Body:** [`LoginDto`](./DTOs.md)
- **Responses:**
  - `200 OK`: User logged in successfully.
  - `401 Unauthorized`: Invalid credentials.

#### `POST /logout`

- **Summary:** Log out user (clear cookie).
- **Description:** Clears the `accessToken` cookie, effectively logging out the user.
- **Responses:**
  - `200 OK`: Logged out successfully.

#### `GET /github`

- **Summary:** Initiate GitHub OAuth2 login.
- **Description:** Redirects the user to GitHub's authentication page.
- **Guards:** [`GitHubAuthGuard`](./Guards.md)
- **Responses:**
  - `302 Found`: Redirects to GitHub login.

#### `GET /github/callback`

- **Summary:** Handle GitHub OAuth2 callback and issue JWT token.
- **Description:** This is the callback URL registered with GitHub. After successful authentication with GitHub, this endpoint processes the GitHub profile, validates it, issues a JWT, sets it as a cookie, and redirects the user (either to a frontend URL or a CLI callback).
- **Guards:** [`GitHubAuthGuard`](./Guards.md)
- **Query Parameters:**
  - `state` (optional): State parameter for CSRF protection and passing custom data.
  - `cli_port` (optional): Port for CLI specific callback redirection.
- **Responses:**
  - `200 OK`: GitHub login successful with JWT issued.
  - `401 Unauthorized`: Unauthorized or failed login attempt.

#### `GET /google`

- **Summary:** Initiate Google OAuth2 login.
- **Description:** Redirects the user to Google's authentication page.
- **Guards:** [`GoogleAuthGuard`](./Guards.md)
- **Responses:**
  - `302 Found`: Redirects to Google login.

#### `GET /google/callback`

- **Summary:** Handle Google OAuth2 callback and issue JWT token.
- **Description:** This is the callback URL registered with Google. After successful authentication with Google, this endpoint processes the Google profile, validates it, issues a JWT, sets it as a cookie, and redirects the user (either to a frontend URL or a CLI callback).
- **Guards:** [`GoogleAuthGuard`](./Guards.md)
- **Query Parameters:**
  - `state` (optional): State parameter for CSRF protection and passing custom data (e.g., `cli_port`, `csrf_token`).
- **Responses:**
  - `200 OK`: Google login successful with JWT issued.
  - `401 Unauthorized`: Unauthorized or failed login attempt.

#### `POST /register`

- **Summary:** Register a new user.
- **Description:** Creates a new user account with the provided details and sends an email verification link.
- **Request Body:** [`RegisterDto`](./DTOs.md)
- **Responses:**
  - `201 Created`: User registered successfully.
  - `400 Bad Request`: Validation failed or user already exists.

#### `POST /resend-verification`

- **Summary:** Resend email verification link.
- **Description:** Triggers the sending of a new email verification link to the specified email address.
- **Request Body:** `{ email: string }`
- **Responses:**
  - `200 OK`: Verification email sent.
  - `404 Not Found`: User not found.

#### `GET /verify-email`

- **Summary:** Verify user email address.
- **Description:** Verifies a user's email address using a token received via email.
- **Query Parameters:** [`VerifyEmailDto`](./DTOs.md)
- **Responses:**
  - `200 OK`: Email verified successfully.
  - `400 Bad Request`: Invalid or expired token.

#### `GET /me`

- **Summary:** Get current authenticated user.
- **Description:** Returns the profile information of the currently authenticated user.
- **Security:** `BearerAuth` (JWT required)
- **Guards:** [`JwtAuthGuard`](./Guards.md)
- **Responses:**
  - `200 OK`: User profile returned.
  - `401 Unauthorized`: No valid JWT token provided.
