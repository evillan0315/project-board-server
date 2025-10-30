# Configuration Module

The `config` module is responsible for loading, validating, and providing access to environment variables used throughout the Project Planner Server. It leverages `Zod` for robust schema validation, ensuring that all necessary configuration parameters are present and correctly formatted.

## Service

### `ConfigService` (`src/config/config.service.ts`)
A singleton-like service that encapsulates the application's configuration logic.

**Key Responsibilities:**
-   Loads environment variables from the `.env` file using `dotenv`.
-   Validates environment variables against a predefined Zod schema (`configSchema`).
-   Provides a type-safe way to access individual configuration values.
-   Throws an error early in the application lifecycle if critical environment variables are missing or invalid, preventing runtime issues.

**Key Methods:**
-   `constructor()`: Initializes the service. It attempts to parse `process.env` against `configSchema`. If validation fails, it logs errors and throws an exception.
-   `get<T extends keyof typeof this.envConfig>(key: T)`: Retrieves the value of a specific environment variable by its key. The return type is inferred from the Zod schema, providing strong type safety.
-   `getVariables()`: Returns the entire parsed and validated environment configuration object.

## Configuration Schema (`configSchema` in `src/config/config.service.ts`)

The `configSchema` defines the expected structure and types of all environment variables. It ensures:

-   **Type Safety:** Variables are parsed into their correct types (e.g., `PORT` as a number, `FRONTEND_URL` as a URL string).
-   **Required Fields:** Critical variables are marked as `min(1)` or without `optional()`.
-   **Default Values:** Sensible defaults are provided for optional variables (e.g., `NODE_ENV`, `PORT`, `GOOGLE_GEMINI_MODEL`).
-   **Enum Validation:** `NODE_ENV` is restricted to known values (`development`, `production`, `test`).
-   **URL Validation:** Callback URLs are validated as proper URLs.

**Examples of Validated Variables:**
-   `PORT`: Server port (number, default: 4000).
-   `NODE_ENV`: Application environment ('development', 'production', 'test').
-   `DATABASE_URL`: Connection string for PostgreSQL.
-   `JWT_SECRET`, `JWT_VERIFICATION_SECRET`: Secrets for JWT signing.
-   `FRONTEND_URL`, `BASE_URL`: URLs for redirects and internal links.
-   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`: Google OAuth credentials.
-   `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`: GitHub OAuth credentials.
-   `GOOGLE_GEMINI_API_KEY`, `GOOGLE_GEMINI_MODEL`, `OPENAI_API_KEY`: AI service credentials.
-   `BASE_DIR`: Base directory for Git operations.
-   `MAIL_SERVICE`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`: Email service credentials.

## Usage

The `ConfigService` is typically instantiated once at application startup (e.g., in `src/main.ts` or when a router is registered) and then injected or passed to other services that require access to configuration settings.

```typescript
// Example: In a service needing config
import { ConfigService } from './config/config.service';

export class MyService {
  constructor(private readonly configService: ConfigService) {
    const jwtSecret = this.configService.get('JWT_SECRET');
    console.log(`Using JWT Secret: ${jwtSecret}`);
  }
}
```
This approach centralizes configuration management, makes it explicitly typed, and ensures that the application environment is correctly set up before significant operations begin.