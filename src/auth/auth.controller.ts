import { Controller, Post, Body, Res, UseGuards, Get, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  CreateJwtUserDto,
  LoginResponseDto,
  AuthResponseDto,
  AuthUserDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthRequest } from './interfaces/auth-request.interface';
import { GoogleAuthGuard } from './guards/google.guard';
import { GitHubAuthGuard } from './guards/github.guard';
import { JwtAuthGuard } from './auth.guard';
import { Response, Request } from 'express';
import { GitHubProfileDto, GitHubTokenDto } from './dto/github-profile.dto';
import { GoogleProfileDto } from './dto/google-profile.dto';
import { GoogleTokenDto } from './dto/google-token.dto';
import { Role, User } from '@prisma/client';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

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
    };

    const user = await this.authService.validateOAuthProfile(provider, profile, tokens);

    const payload: CreateJwtUserDto = {
      id: user.id,
      sub: user.id,
      email: user.email,
      role: user.role ?? Role.USER,
      image: user.image ?? undefined,
      name: user.name ?? '',
      phone_number: user.phone_number ?? '',
      provider,
      username: user.username ?? undefined,
    };

    const accessToken = await this.authService.generateToken(payload);
    return { accessToken, user, profile, tokens };
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Successful login',
    type: LoginResponseDto,
  })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const { access_token, refresh_token, user } = await this.authService.login(dto);
    return { access_token, refresh_token, user };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Log out user (clear cookie)' })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: {
      example: { message: 'Logged out successfully' },
    },
  })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken');
    return { message: 'Logged out successfully' };
  }

  /** GitHub OAuth flow */
  @Get('github')
  @UseGuards(GitHubAuthGuard)
  @ApiOperation({ summary: 'Initiate GitHub OAuth2 login' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub login' })
  async githubAuth() {
    // Handled by Passport GitHub strategy
  }

  @Get('github/callback')
  @UseGuards(GitHubAuthGuard)
  @ApiOperation({
    summary: 'Handle GitHub OAuth2 callback and issue JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'GitHub login successful with JWT',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async githubAuthRedirect(
    @Req() req: AuthRequest,
    @Res() res: Response,
    @Query('state') state?: string,
    @Query('cli_port') cliPort?: number,
  ) {
    try {
      const { accessToken, user } = await this.handleOAuthCallback('github', req);

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      const redirectUrl = cliPort
        ? `http://localhost:${cliPort}/auth/callback?accessToken=${accessToken}&userId=${user.id}&userEmail=${user.email}&userName=${encodeURIComponent(user.name || '')}&userImage=${encodeURIComponent(user.image || '')}&userRole=${user.role}&username=${encodeURIComponent(user.username || '')}&provider=github`
        : `${process.env.FRONTEND_URL}/login?action=success&accessToken=${accessToken}&userId=${user.id}&userEmail=${user.email}&userName=${encodeURIComponent(user.name || '')}&userImage=${encodeURIComponent(user.image || '')}&userRole=${user.role}&username=${encodeURIComponent(user.username || '')}&provider=github`;

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      return res.redirect('/login?error=OAuth%20Login%20Failed');
    }
  }

  /** Google OAuth flow */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth2 login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google login' })
  async googleAuth() {
    // Handled by Passport Google strategy
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Handle Google OAuth2 callback and issue JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'Google login successful with JWT',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async googleAuthRedirect(
    @Req() req: AuthRequest,
    @Res() res: Response,
    @Query('state') state?: string,
  ) {
    try {
      let cliPort: number | undefined;

      if (state) {
        try {
          const parsedState = JSON.parse(state);
          cliPort = parsedState.cli_port;
        } catch {
          console.warn('Invalid Google OAuth state parameter.');
        }
      }

      const { accessToken, user } = await this.handleOAuthCallback('google', req);

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      const redirectUrl = cliPort
        ? `http://localhost:${cliPort}/auth/callback?accessToken=${accessToken}&userId=${user.id}&userEmail=${user.email}&userName=${encodeURIComponent(user.name || '')}&userImage=${encodeURIComponent(user.image || '')}&userRole=${user.role}&username=${encodeURIComponent(user.username || '')}&provider=google`
        : `${process.env.FRONTEND_URL}/login?action=success&accessToken=${accessToken}&userId=${user.id}&userEmail=${user.email}&userName=${encodeURIComponent(user.name || '')}&userImage=${encodeURIComponent(user.image || '')}&userRole=${user.role}&username=${encodeURIComponent(user.username || '')}&provider=google`;

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth error:', error);
      return res.redirect('/login?error=OAuth%20Login%20Failed');
    }
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered',
    type: AuthResponseDto,
  })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    const { access_token, user } = await this.authService.register(dto);
    return { access_token, user };
  }

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

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify user email address' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: { example: { message: 'Email verified successfully' } },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Query() query: VerifyEmailDto) {
    return this.authService.verifyEmail(query.token);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset link for the given email' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'If a matching account was found, a password reset email has been sent.',
    schema: {
      example: {
        message: 'If a matching account was found, a password reset email has been sent.',
      },
    },
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset user password using a provided token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password has been successfully reset.',
    schema: { example: { message: 'Password has been successfully reset.' } },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired password reset token.' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'User profile returned',
    type: AuthUserDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@Req() req: any) {
    const authUser: CreateJwtUserDto = req.user; // <-- Correct type
    if (!authUser?.email) return null;

    return this.prisma.user.findUnique({
      where: { email: authUser.email },
    });
  }
}
