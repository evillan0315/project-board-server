import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UserRole } from './enums/user-role.enum';

import { GoogleProfileDto } from './dto/google-profile.dto';
import { GoogleTokenDto } from './dto/google-token.dto';
import { GitHubProfileDto, GitHubTokenDto } from './dto/github-profile.dto';

import { JwtPayload } from './interfaces/jwt-payload.interface';
import { OAuthService } from './oauth.service';
import { CreateJwtUserDto } from './dto/auth.dto';

/**
 * AuthService handles user authentication and authorization logic.
 * It provides methods for user registration, login, email verification,
 * and integration with OAuth providers like Google and GitHub.
 */
@Injectable()
export class AuthService {
  /**
   * Constructor for AuthService.
   * @param prisma - PrismaService for database interactions.
   * @param jwtService - JwtService for generating and verifying JWT tokens.
   * @param mailService - MailService for sending emails.
   * @param oauthService - OAuthService for handling OAuth authentication.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly oauthService: OAuthService,
  ) {}

  /**
   * Generates an email verification token for a given user ID.
   * @param userId - The ID of the user to generate the token for.
   * @returns The generated JWT token.
   * @private
   */
  private generateEmailVerificationToken(userId: string) {
    return this.jwtService.sign(
      { sub: userId },
      {
        secret: process.env.JWT_VERIFICATION_SECRET,
        expiresIn: process.env.JWT_VERIFICATION_EXPIRES_IN || '1d',
      },
    );
  }

  async login(
    dto: LoginDto,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: CreateJwtUserDto;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { password: true },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.password.hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: CreateJwtUserDto = {
      id: user.id,
      sub: user.id,
      email: user.email,
      role: user.role ?? Role.USER,
      image: user.image ?? undefined,
      name: user.name ?? '',
      phone_number: user.phone_number ?? '',
    };

    // Generate tokens
    const access_token = await this.generateToken(payload);
    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
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
      Logger.error('User creation failed: No user returned from database');
      throw new InternalServerErrorException('User could not be created');
    }

    const token = this.generateEmailVerificationToken(user.id);
    const verifyUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}`;

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
      role: user.role ?? Role.USER,
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
   * @throws BadRequestException if the token is invalid or expired.
   */
  async verifyEmail(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_VERIFICATION_SECRET,
      });

      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { emailVerified: new Date() },
      });

      return { message: 'Email verified successfully.' };
    } catch (err) {
      throw new BadRequestException('Invalid or expired token.');
    }
  }

  /**
   * Resends the email verification email to a user.
   * @param email - The email address of the user.
   * @returns A promise that resolves to an object containing a success message.
   * @throws NotFoundException if the user is not found.
   */
  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new NotFoundException('User not found.');
    if (user.emailVerified) return { message: 'Email already verified.' };

    const token = this.generateEmailVerificationToken(user.id);
    const verifyUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}`;

    await this.mailService.sendVerificationEmail(
      user.email,
      user.name ?? 'User',
      verifyUrl,
    );

    return { message: 'Verification email sent.' };
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
    return this.jwtService.signAsync(payload);
  }

  /**
   * Validates an access token and returns its decoded payload.
   * @param token The JWT access token to validate.
   * @returns The decoded JwtPayload if the token is valid.
   * @throws UnauthorizedException if the token is invalid or expired.
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const payload: JwtPayload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      } else if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      } else {
        Logger.error(
          `Unknown error validating token: ${error.message}`,
          error.stack,
        );
        throw new UnauthorizedException('Token validation failed');
      }
    }
  }
}
