import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express'; // Import Request type for better type safety
import { randomBytes } from 'crypto'; // For generating cryptographically strong tokens

/**
 * GoogleAuthGuard extends NestJS's AuthGuard for Google OAuth2.
 * It dynamically adds a 'state' parameter to the authentication request,
 * which includes a 'cli_port' from the query parameters and a CSRF token.
 *
 * IMPORTANT: When a custom 'state' is provided to the OAuth provider (like Google),
 * you are responsible for implementing proper CSRF validation. The built-in
 * Passport 'state' mechanism for CSRF is typically bypassed in such cases.
 *
 * Ensure your callback handler (e.g., your Google OAuth success route)
 * validates the 'csrf_token' returned in the 'state' against a token
 * stored securely on the server-side (e.g., in a session or a temporary cache)
 * to prevent Cross-Site Request Forgery (CSRF) attacks.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {

  /**
   * Overrides getAuthenticateOptions to dynamically add state.
   * This method is called before redirecting the user to Google for authentication.
   */
  getAuthenticateOptions(context: ExecutionContext) {
    // Cast request to Express's Request type for better autocomplete and type safety
    const request = context.switchToHttp().getRequest<Request>();
    const cliPort = request.query.cli_port as string; // Get cli_port from query parameters, cast to string

    // 1. Generate a strong, unique CSRF token for this specific authentication request.
    const csrfToken = randomBytes(16).toString('hex');

    // 2. IMPORTANT: Store this `csrfToken` securely on the server (e.g., in req.session,
    //    a temporary cache, or a signed cookie) BEFORE redirecting to Google.
    //    This token will be retrieved and validated in `handleRequest` or your
    //    callback controller to prevent CSRF attacks.
    //
    // Example with `express-session` middleware:
    // if (request.session) {
    //   request.session.googleOAuthCsrfToken = csrfToken;
    // } else {
    //   // Handle cases where session is not available (e.g., log warning, use alternative storage)
    //   console.warn('Session not available for storing CSRF token. CSRF protection may be compromised.');
    // }

    // Prepare the data to be sent in the 'state' parameter.
    // This object will be stringified and URL-encoded.
    const stateData: { cli_port?: string; csrf_token: string } = {
      csrf_token: csrfToken, // Always include the generated CSRF token
    };

    if (cliPort) {
      stateData.cli_port = cliPort; // Include cli_port if present
    }

    // Encode the state data as a JSON string. Passport/OAuth provider will URL-encode this string.
    const stateParam = JSON.stringify(stateData);

    return {
      scope: ['email', 'profile'], // Required scopes for Google
      accessType: 'offline', // For refresh tokens (if needed for long-term access)
      prompt: 'consent', // For explicit consent (if needed)
      state: stateParam, // Pass the dynamically created state
    };
  }

  /**
   * canActivate is called by NestJS to determine if the guard should allow the request.
   * It initiates the Passport.js authentication flow.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // The `super.canActivate()` call triggers the Passport.js strategy.
    // It will either redirect to Google or process the callback.
    // Errors during this process are typically caught by `handleRequest`.
    return (await super.canActivate(context)) as boolean;
  }

  /**
   * handleRequest is called by Passport.js after the authentication strategy completes.
   * It processes the result of the authentication attempt and performs CSRF validation.
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    // --- CRITICAL CSRF VALIDATION ---
    // This section validates the 'state' parameter returned by Google.
    // It is essential when you provide a custom 'state' parameter.

    const returnedStateEncoded = request.query.state as string;

    if (!returnedStateEncoded) {
      console.error('OAuth state parameter missing from callback.');
      throw new UnauthorizedException('Authentication failed: Missing state parameter.');
    }

    let parsedState: { cli_port?: string; csrf_token: string };
    try {
      // Decode the URL-encoded state string and then parse the JSON.
      parsedState = JSON.parse(decodeURIComponent(returnedStateEncoded));
    } catch (parseError) {
      console.error('Failed to parse OAuth state parameter:', parseError);
      throw new UnauthorizedException('Authentication failed: Invalid state parameter format.');
    }

    const receivedCsrfToken = parsedState.csrf_token;

    // TODO: Retrieve the original CSRF token that was stored on the server
    // (e.g., in `req.session.googleOAuthCsrfToken` or your temporary store)
    // when the user initiated the login flow in `getAuthenticateOptions`.
    // Example with `express-session`:
    // const expectedCsrfToken = request.session?.googleOAuthCsrfToken;

    // 3. Perform the actual CSRF token comparison.
    // This is a placeholder; you MUST implement the retrieval of `expectedCsrfToken`.
    // if (!expectedCsrfToken || receivedCsrfToken !== expectedCsrfToken) {
    //   console.error('CSRF token mismatch or missing. Expected:', expectedCsrfToken, 'Received:', receivedCsrfToken);
    //   // TODO: Consider clearing the session/cookie for `expectedCsrfToken` after validation.
    //   throw new UnauthorizedException('Authentication failed: CSRF token mismatch.');
    // }

    // 4. (Optional) After successful CSRF validation, clean up the stored token.
    //    Example with `express-session`:
    // if (request.session) {
    //   delete request.session.googleOAuthCsrfToken;
    // }

    // --- END CSRF VALIDATION ---

    // Handle authentication errors from Passport.js or if no user is found.
    if (err || !user) {
      // If there's an error from Passport or no user object is returned,
      // throw an UnauthorizedException. This allows NestJS's exception filters
      // to catch and handle it gracefully (e.g., return a 401 status code).
      throw err || new UnauthorizedException('Authentication failed.');
    }

    // Optionally, if `cli_port` needs to be immediately accessible after authentication,
    // you can attach it to the request object or the user object.
    // For example, if you need it in a subsequent interceptor or your controller:
   //(request as any).cliPort = parsedState.cli_port; // Augment request object if needed later

    // Return the authenticated user object. This user object will be injected into
    // the request (e.g., `req.user`) in the controller method that uses this guard.
    return user;
  }
}
