## Authentication Guards

Authentication Guards in this module are responsible for protecting routes and WebSocket events by enforcing authentication and authorization rules.

### `JwtAuthGuard`

- **Purpose:** Protects HTTP routes and WebSocket connections by validating the JWT token provided in the request.
- **Extends:** `AuthGuard('jwt')` from `@nestjs/passport`.
- **Token Extraction:** It extracts the JWT token from:
  - `accessToken` HTTP cookie.
  - `accessToken` from WebSocket handshake cookies.
  - `Authorization: Bearer <token>` HTTP header.
- **Behavior:** If the token is valid, it attaches the authenticated user object to the request. If invalid or missing, it returns `null`, which can be handled by an exception filter or the controller.

### `GoogleAuthGuard`

- **Purpose:** Initiates and handles the callback for the Google OAuth2 authentication flow.
- **Extends:** `AuthGuard('google')` from `@nestjs/passport`.
- **Dynamic State:** Overrides `getAuthenticateOptions` to dynamically generate a `state` parameter. This `state` includes:
  - `cli_port` (optional): Passed from query parameters, used for redirecting to a CLI's local server after authentication.
  - `csrf_token`: A cryptographically strong token generated for CSRF protection. **Important:** The callback handler (e.g., `AuthController.googleAuthRedirect`) is responsible for validating this `csrf_token` against a securely stored original token.
- **Request Handling:** Its `handleRequest` method performs the CSRF validation on the returned state parameter and handles authentication success or failure.

### `GitHubAuthGuard`

- **Purpose:** Initiates and handles the callback for the GitHub OAuth2 authentication flow.
- **Extends:** `AuthGuard('github')` from `@nestjs/passport`.
- **Behavior:** Similar to `GoogleAuthGuard` but configured for GitHub. It also supports passing a `cli_port` for CLI-specific redirects.

### `RolesGuard`

- **Purpose:** Implements role-based access control (RBAC). It checks if the authenticated user has the necessary roles to access a specific route or resource.
- **Implements:** `CanActivate` interface.
- **Dependencies:** `Reflector` from `@nestjs/core` to read metadata (roles) attached to route handlers or controllers.
- **Usage:** Used in conjunction with the `@Roles()` decorator.
- **Behavior:**
  - Reads `requiredRoles` from the route's metadata.
  - If no roles are specified, access is granted.
  - If roles are specified, it checks if the `user` object (attached by `JwtAuthGuard` or OAuth guards) exists, has a `role` property, and if that role is included in the `requiredRoles`.
  - **Throws:** `ForbiddenException` if the user's role is insufficient for the requested resource.
