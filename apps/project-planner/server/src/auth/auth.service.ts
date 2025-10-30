import { Logger } from 'fastify';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

import { PrismaService, Role } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { OAuthService } from './oauth.service';
import {
  RegisterDto,
  LoginDto,
  CreateJwtUserDto,
  GoogleProfileDto,
  GoogleTokenDto,
  GitHubProfileDto,
  GitHubTokenDto,
  JwtPayload,
} from './types';
import { CustomError } from '../common/errors';
import { ConfigService } from '../config';

/**
 * AuthService handles user authentication and authorization logic.
 * It provides methods for user registration, login, email verification,
 * and integration with OAuth providers like Google and GitHub.
 */
export class AuthService {
  private readonly logger: Logger;

  /**
   * Constructor for AuthService.
   * @param prisma - PrismaService for database interactions.
   * @param mailService - MailService for sending emails.
   * @param oauthService - OAuthService for handling OAuth authentication.
   * @param configService - ConfigService for environment variables.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly oauthService: OAuthService,
    private readonly configService: ConfigService,
  ) {
    this.logger = new Logger({ level: 'info' }); // Basic logger for Node.js
  }

  /**
   * Generates an email verification token for a given user ID.
   * @param userId - The ID of the user to generate the token for.
   * @returns The generated JWT token.
   * @private
   */
  private generateEmailVerificationToken(userId: string) {
    return jwt.sign(
      { sub: userId },
      this.configService.get('JWT_VERIFICATION_SECRET'),
      {
        expiresIn: this.configService.get('JWT_VERIFICATION_EXPIRES_IN'),
      },
    );
  }

  async login(dto: LoginDto): Promise<{
    access_token: string;
    refresh_token: string;
    user: CreateJwtUserDto;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { password: true },
    });

    if (!user || !user.password) {
      throw new CustomError('Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.password.hash,
    );
    if (!isPasswordValid) {
      throw new CustomError('Invalid credentials', 401);
    }

    const payload: CreateJwtUserDto = {
      id: user.id,
      sub: user.id,
      email: user.email,
      role: user.role,
      image: user.image ?? undefined,
      name: user.name ?? '',
      phone_number: user.phone_number ?? '',
    };

    // Generate tokens
    const access_token = await this.generateToken(payload);
    const refresh_token = jwt.sign(payload, this.configService.get('JWT_SECRET'), {
      expiresIn: '7d', // Refresh token validity
    });

    return { access_token, refresh_token, user: payload };
  }

  async register(
    dto: RegisterDto,
  ): Promise<{ access_token: string; user: CreateJwtUserDto }> {
    const hash = await bcrypt.hash(dto.password, 10);
    const createUser = {
      email: dto.email,
      name: dto.name,
      phone_number: dto.phone_number || undefined,
      role: Role.USER,
    };

    const user = await this.prisma.user.create({
      data: {
        ...createUser,
        password: { create: { hash } },
      },
    });

    if (!user) {
      this.logger.error('User creation failed: No user returned from database');
      throw new CustomError('User could not be created', 500);
    }

    const token = this.generateEmailVerificationToken(user.id);
    const verifyUrl = `${this.configService.get('BASE_URL')}/auth/verify-email?token=${token}`;

    await this.mailService.sendVerificationEmail(
      user.email,
      user.name ?? 'User',
      verifyUrl,
    );

    // Construct JWT user payload
    const payload: CreateJwtUserDto = {
      id: user.id,
      sub: user.id,
      email: user.email,
      role: user.role,
      image: user.image ?? undefined,
      name: user.name ?? '',
      phone_number: user.phone_number ?? '',
    };

    // Generate access token
    const access_token = await this.generateToken(payload);

    return { access_token, user: payload };
  }

  /**
   * Verifies a user's email address using a verification token.
   * @param token - The email verification token.
   * @returns A promise that resolves to an object containing a success message.
   * @throws CustomError if the token is invalid or expired.
   */
  async verifyEmail(token: string) {
    try {
      const payload = jwt.verify(token, this.configService.get('JWT_VERIFICATION_SECRET')) as JwtPayload;

      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { emailVerified: new Date() },
      });

      return { message: 'Email verified successfully.' };
    } catch (err) {
      throw new CustomError('Invalid or expired token.', 400);
    }
  }

  /**
   * Resends the email verification email to a user.
   * @param email - The email address of the user.
   * @returns A promise that resolves to an object containing a success message.
   * @throws CustomError if the user is not found.
   */
  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new CustomError('User not found.', 404);
    if (user.emailVerified) return { message: 'Email already verified.' };

    const token = this.generateEmailVerificationToken(user.id);
    const verifyUrl = `${this.configService.get('BASE_URL')}/auth/verify-email?token=${token}`;

    await this.mailService.sendVerificationEmail(
      user.email,
      user.name ?? 'User',
      verifyUrl,
    );

    return { message: 'Verification email sent.' };
  }

  /**
   * Initiates the password reset process by generating a token and sending a reset email.
   * @param email - The email address of the user requesting password reset.
   * @returns A promise that resolves with a success message (generic for security).
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        message:
          'If a matching account was found, a password reset email has been sent.',
      };
    }

    const plainTextToken = crypto.randomBytes(32).toString('hex');
    const dbTokenHash = crypto
      .createHash('sha256')
      .update(plainTextToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: dbTokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    });

    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${plainTextToken}`;
    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.name ?? 'User',
      resetUrl,
    );

    return {
      message:
        'If a matching account was found, a password reset email has been sent.',
    };
  }

  /**
   * Resets the user's password using a provided reset token.
   * @param token - The plaintext password reset token received via email.
   * @param newPassword - The new password for the user.
   * @returns A promise that resolves with a success message.
   * @throws CustomError if the token is invalid, expired, or password criteria not met.
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    if (!newPassword || newPassword.length < 8) {
      throw new CustomError(
        'Password must be at least 8 characters long.',
        400,
      );
    }

    const dbTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: dbTokenHash,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
      },
      include: { password: true },
    });

    if (!user) {
      throw new CustomError('Invalid or expired password reset token.', 400);
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        password: {
          upsert: {
            create: { hash: newPasswordHash },
            update: { hash: newPasswordHash },
          },
        },
      },
    });

    return { message: 'Password has been successfully reset.' };
  }

  /**
   * Validates a user by ID and returns their information.
   * @param userId - The ID of the user to validate.
   * @returns A promise that resolves to the user's information.
   */
  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone_number: true,
        createdAt: true,
        image: true,
        username: true,
      },
    });
  }

  /**
   * Validates an OAuth profile from a given provider (Google or GitHub).
   * @param provider - The OAuth provider ('google' or 'github').
   * @param profile - The user's profile data from the provider.
   * @param tokens - The access and refresh tokens from the provider.
   * @returns A promise that resolves to the validated user data.
   */
  async validateOAuthProfile(
    provider: 'google' | 'github',
    profile: GoogleProfileDto | GitHubProfileDto,
    tokens: GoogleTokenDto | GitHubTokenDto,
  ) {
    return await this.oauthService.validate(provider, profile, tokens);
  }

  /**
   * Generates a JWT token for a given user payload.
   * @param payload - The user payload to include in the token.
   * @returns A promise that resolves to the generated JWT token.
   */
  async generateToken(payload: CreateJwtUserDto): Promise<string> {
    return jwt.sign(payload, this.configService.get('JWT_SECRET'), { expiresIn: '1d' });
  }

  /**
   * Validates an access token and returns its decoded payload.
   * @param token The JWT access token to validate.
   * @returns The decoded JwtPayload if the token is valid.
   * @throws CustomError if the token is invalid or expired.
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const payload: JwtPayload = jwt.verify(token, this.configService.get('JWT_SECRET')) as JwtPayload;
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new CustomError('Token expired', 401);
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new CustomError('Invalid token', 401);
      } else {
        this.logger.error(
          `Unknown error validating token: ${error.message}`,
          error.stack,
        );
        throw new CustomError('Token validation failed', 401);
      }
    }
  }
}
