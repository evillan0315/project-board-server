// File: src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  Get,
  Req,
  BadRequestException,
  Query,
  NotFoundException,
  Redirect,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, CreateJwtUserDto } from './dto/auth.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthRequest } from './interfaces/auth-request.interface';
import { GoogleAuthGuard } from './guards/google.guard';
import { GitHubAuthGuard } from './guards/github.guard';
import { JwtAuthGuard } from './auth.guard';
import { Response, Request } from 'express';
import { GitHubProfileDto, GitHubTokenDto } from './dto/github-profile.dto';
import { GoogleProfileDto } from './dto/google-profile.dto';
import { GoogleTokenDto } from './dto/google-token.dto';
import { UserRole } from './enums/user-role.enum';
import { Role, User } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

/**
 * AuthController handles authentication-related endpoints, including user registration,
 * login, logout, email verification, and OAuth2 authentication with Google and GitHub.
 *
 * @ApiTags Auth
 * @Controller api/auth
 */
@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Handles the OAuth2 callback from Google or GitHub, validating the profile,
   * generating a JWT token, and returning the access token and user information.
   *
   * @private
   * @async
   * @function handleOAuthCallback
   * @param {('google' | 'github')} provider - The OAuth2 provider (either 'google' or 'github').
   * @param {AuthRequest} req - The request object containing user profile and tokens.
   * @returns {Promise<{ accessToken: string; user: any }>} - A promise that resolves to an object
   * containing the access token and user information.  The user object type is 'any' because the
   * specific profile type will depend on the OAuth2 provider.
   */
  private async handleOAuthCallback(
    provider: 'google' | 'github',
    req: AuthRequest,
  ): Promise<{
    accessToken: string;
    user: User;
    profile?: GoogleProfileDto | GitHubProfileDto;
    tokens: GoogleTokenDto | GitHubTokenDto;
  }> {
    const { profile, tokens } = req.user as {
      profile: GoogleProfileDto | GitHubProfileDto;
      tokens: GoogleTokenDto | GitHubTokenDto;
      // provider: 'google' | 'github';
    };

    const user = await this.authService.validateOAuthProfile(
      provider,
      profile,
      tokens,
    );

    const payload: CreateJwtUserDto = {
      id: user.id,
      sub: user.id,
      email: user.email,
      role: user.role ?? Role.USER,
      image: user.image ?? undefined,
      name: user.name ?? '',
      phone_number: user.phone_number ?? '',
      provider,
      username: user.username ?? undefined, // Include username in JWT payload
      // tokens,
    };

    const accessToken = await this.authService.generateToken(payload);

    return { accessToken, user, profile, tokens };
  }

  /**
   * Logs in a user and sets a JWT cookie.
   *
   * @Post login
   * @ApiOperation summary Log in a user and set JWT cookie
   * @ApiResponse status 200 - User logged in successfully
   * @ApiResponse status 401 - Invalid credentials
   * @async
   * @function login
   * @param {LoginDto} dto - The login credentials data transfer object.
   * @param {Response} res - The Express response object for setting cookies.
   * @returns {Promise<any>} - A promise that resolves to the user information.  The user object type is 'any' because the
   * specific shape may depend on the authentication strategy.
   */
  @Post('login')
  @ApiOperation({ summary: 'Log in a user and set JWT cookie' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.login(dto);
    res.cookie('accessToken', user.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return user;
  }

  /**
   * Logs out a user by clearing the JWT cookie.
   *
   * @Post logout
   * @ApiOperation summary Log out user (clear cookie)
   * @ApiResponse status 200 - Logged out successfully
   * @async
   * @function logout
   * @param {Response} res - The Express response object for clearing cookies.
   * @returns {Promise<{ message: string }>} - A promise that resolves to a success message.
   */
  @Post('logout')
  @ApiOperation({ summary: 'Log out user (clear cookie)' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken');
    return { message: 'Logged out successfully' };
  }

  /**
   * Initiates the GitHub OAuth2 login flow.
   *
   * @Get github
   * @UseGuards GitHubAuthGuard
   * @ApiOperation summary Initiate GitHub OAuth2 login
   * @ApiResponse status 302 - Redirects to GitHub login
   * @async
   * @function githubAuth
   */
  @Get('github')
  @UseGuards(GitHubAuthGuard)
  @ApiOperation({ summary: 'Initiate GitHub OAuth2 login' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub login' })
  async githubAuth(
    @Query('state') state?: string,
    @Query('cli_port') cliPort?: number,
  ) {
    // The state and cli_port are handled by Passport.js and the callback
    // Passport-github2 will automatically include `state` if configured.
    // cli_port can be passed through to the session or directly to the callback if needed.
  }

  /**
   * Handles the GitHub OAuth2 callback, issues a JWT token, and redirects the user.
   *
   * @Get github/callback
   * @UseGuards GitHubAuthGuard
   * @ApiOperation summary Handle GitHub OAuth2 callback and issue JWT token
   * @ApiResponse status 200 - GitHub login successful with JWT issued
   * @ApiResponse status 401 - Unauthorized or failed login attempt
   * @async
   * @function githubAuthRedirect
   * @param {AuthRequest} req - The request object containing user information from GitHub.
   * @param {Response} res - The Express response object for setting cookies and redirecting.
   * @returns {Promise<any>} - A promise that resolves after redirecting the user.
   */
  @Get('github/callback')
  @UseGuards(GitHubAuthGuard)
  @ApiOperation({
    summary: 'Handle GitHub OAuth2 callback and issue JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'GitHub login successful with JWT issued',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or failed login attempt',
  })
  async githubAuthRedirect(
    @Req() req: AuthRequest,
    @Res() res: Response,
    @Query('state') state?: string,
    @Query('cli_port') cliPort?: number,
  ) {
    try {
      // Basic state validation for CLI callback
      if (cliPort && (!state || state !== req.query.state)) {
        // If cli_port is present, it's likely a CLI request, validate state
        // Note: Passport.js handles its own state verification by default. This is an additional layer
        // if the client passes an explicit 'state' that needs to be matched.
        console.warn(
          'State mismatch in GitHub CLI callback. Potential CSRF attempt.',
        );
        return res.redirect('/login?error=State%20Mismatch');
      }

      const { accessToken, user } = await this.handleOAuthCallback(
        'github',
        req,
      );

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      if (cliPort) {
        // Redirect to CLI's local server callback
        const cliCallbackUrl = `http://localhost:${cliPort}/auth/callback?accessToken=${accessToken}&userId=${user.id}&userEmail=${user.email}&userName=${encodeURIComponent(user.name || '')}&userImage=${encodeURIComponent(user.image || '')}&userRole=${user.role}&username=${encodeURIComponent(user.username || '')}&provider=github`;
        return res.redirect(cliCallbackUrl);
      } else {
        // Original frontend redirect
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?action=success&accessToken=${accessToken}&userId=${user.id}&userEmail=${user.email}&userName=${encodeURIComponent(user.name || '')}&userImage=${encodeURIComponent(user.image || '')}&userRole=${user.role}&username=${encodeURIComponent(user.username || '')}&provider=github`,
        );
      }
    } catch (error) {
      console.error('OAuth redirect error:', error);
      return res.redirect('/login?error=OAuth%20Login%20Failed');
    }
  }

  /**
   * Initiates the Google OAuth2 login flow.
   *
   * @Get google
   * @UseGuards GoogleAuthGuard
   * @ApiOperation summary Initiate Google OAuth2 login
   * @ApiResponse status 302 - Redirects to Google login
   * @async
   * @function googleAuth
   */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth2 login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google login' })
  async googleAuth(
    @Req() req: Request,
    @Res() res: Response,
    @Query('cli_port') cliPort?: number,
  ) {}
  /*@Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth2 login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google login' })
  async googleAuth(@Query('state') state?: string, @Query('cli_port') cliPort?: number) {
    // The state and cli_port are handled by Passport.js and the callback
    // Passport-google-oauth20 will automatically include `state` if configured.
    // cli_port can be passed through to the session or directly to the callback if needed.
  }*/

  /**
   * Handles the Google OAuth2 callback, issues a JWT token, and redirects the user.
   *
   * @Get google/callback
   * @UseGuards GoogleAuthGuard
   * @ApiOperation summary Handle Google OAuth2 callback and issue JWT token
   * @ApiResponse status 200 - Google login successful with JWT issued
   * @ApiResponse status 401 - Unauthorized or failed login attempt
   * @async
   * @function googleAuthRedirect
   * @param {AuthRequest} req - The request object containing user information from Google.
   * @param {Response} res - The Express response object for setting cookies and redirecting.
   * @returns {Promise<any>} - A promise that resolves after redirecting the user.
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Handle Google OAuth2 callback and issue JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'Google login successful with JWT issued',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or failed login attempt',
  })
  async googleAuthRedirect(
    @Req() req: AuthRequest,
    @Res() res: Response,
    @Query('state') state?: string, // The state parameter returned from Google
  ) {
    try {
      let parsedCliPort: number | undefined;
      let csrfToken: string | undefined;

      if (state) {
        try {
          const parsedState = JSON.parse(state);
          parsedCliPort = parsedState.cli_port;
          console.log(parsedCliPort, 'parsedCliPort');
          csrfToken = parsedState.csrf_token;
        } catch (parseError) {
          console.warn(
            'Could not parse state parameter in Google CLI callback.',
          );
        }
      }

      const { accessToken, user } = await this.handleOAuthCallback(
        'google',
        req,
      );

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      if (parsedCliPort) {
        // Use the parsed cli_port here
        // Redirect to CLI's local server callback
        const cliCallbackUrl = `http://localhost:${parsedCliPort}/auth/callback?accessToken=${accessToken}&userId=${user.id}&userEmail=${user.email}&userName=${encodeURIComponent(user.name || '')}&userImage=${encodeURIComponent(user.image || '')}&userRole=${user.role}&username=${encodeURIComponent(user.username || '')}&provider=google`;
        return res.redirect(cliCallbackUrl);
      } else {
        // Original frontend redirect
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?action=success&accessToken=${accessToken}&userId=${user.id}&userEmail=${user.email}&userName=${encodeURIComponent(user.name || '')}&userImage=${encodeURIComponent(user.image || '')}&userRole=${user.role}&username=${encodeURIComponent(user.username || '')}&provider=google`,
        );
      }
    } catch (error) {
      console.error('OAuth redirect error:', error);
      return res.redirect('/login?error=OAuth%20Login%20Failed');
    }
  }

  /* @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Handle Google OAuth2 callback and issue JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'Google login successful with JWT issued',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or failed login attempt',
  })
  async googleAuthRedirect(
    @Req() req: AuthRequest,
    @Res() res: Response,
    @Query('state') state?: string,
    @Query('cli_port') cliPort?: number,
  ) {
    try {
       // Basic state validation for CLI callback
       if (cliPort && (!state || state !== req.query.state)) {
        // If cli_port is present, it's likely a CLI request, validate state
        console.warn('State mismatch in Google CLI callback. Potential CSRF attempt.');
        return res.redirect('/login?error=State%20Mismatch');
      }

      const { accessToken, user } = await this.handleOAuthCallback(
        'google',
        req,
      );

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      if (cliPort) {
        // Redirect to CLI's local server callback
        const cliCallbackUrl = `http://localhost:${cliPort}/auth/callback?accessToken=${accessToken}&userId=${user.id}&userEmail=${user.email}&userName=${encodeURIComponent(user.name || '')}&userImage=${encodeURIComponent(user.image || '')}&userRole=${user.role}&username=${encodeURIComponent(user.username || '')}&provider=google`;
        return res.redirect(cliCallbackUrl);
      } else {
        // Original frontend redirect
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?action=success&accessToken=${accessToken}&userId=${user.id}&userEmail=${user.email}&userName=${encodeURIComponent(user.name || '')}&userImage=${encodeURIComponent(user.image || '')}&userRole=${user.role}&username=${encodeURIComponent(user.username || '')}&provider=google`,
        );
      }
    } catch (error) {
      console.error('OAuth redirect error:', error);
      return res.redirect('/login?error=OAuth%20Login%20Failed');
    }
  }
*/
  /**
   * Registers a new user.
   *
   * @Post register
   * @ApiOperation summary Register a new user
   * @ApiResponse status 201 - User registered successfully
   * @ApiResponse status 400 - Validation failed or user already exists
   * @async
   * @function register
   * @param {RegisterDto} dto - The registration data transfer object.
   * @returns {Promise<void>} - A promise that resolves when registration is complete.
   */
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or user already exists',
  })
  async register(@Body() dto: RegisterDto): Promise<void> {
    await this.authService.register(dto);
  }

  /**
   * Resends the email verification link to the user.
   *
   * @Post resend-verification
   * @ApiOperation summary Resend email verification link
   * @ApiBody schema containing the user's email address.
   * @async
   * @function resendVerification
   * @param {string} email - The email address of the user.
   * @returns {Promise<any>} - A promise that resolves with the result of resending verification.  The result type is 'any'
   * because the structure of the response from the mail service can vary.
   */
  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend email verification link' })
  @ApiBody({
    schema: {
      properties: { email: { type: 'string', example: 'user@example.com' } },
    },
  })
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }

  /**
   * Verifies the user's email address using the provided token.
   *
   * @Get verify-email
   * @ApiOperation summary Verify user email address
   * @ApiResponse status 200 - Email verified successfully
   * @ApiResponse status 400 - Invalid or expired token
   * @async
   * @function verifyEmail
   * @param {VerifyEmailDto} query - The query parameters containing the verification token.
   * @returns {Promise<any>} - A promise that resolves with the result of email verification.  The result type is 'any' because
   * the response format can depend on the implementation of the verification service.
   */
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify user email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Query() query: VerifyEmailDto) {
    return this.authService.verifyEmail(query.token);
  }

  /**
   * Gets the profile of the currently authenticated user.
   *
   * @Get me
   * @UseGuards JwtAuthGuard
   * @ApiBearerAuth
   * @ApiOperation summary Get current authenticated user
   * @ApiResponse status 200 - User profile returned
   * @ApiResponse status 401 - Unauthorized
   * @async
   * @function getProfile
   * @param {Request} req - The request object containing the user information.
   * @returns {Promise<any>} - A promise that resolves with the user profile.  The user profile type is 'any' because the shape
   * can vary based on the data stored about the user.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req: Request) {
    const meR = req['user'];
    if (meR.email) {
      const getAccount = this.prisma.user.findUnique({
        where: { email: meR?.email },
        include: {
          Account: true,
        },
      });
      if (getAccount) {
        return getAccount;
      } else {
        return meR;
      }
    }
  }
}
