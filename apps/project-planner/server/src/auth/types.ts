import { FastifyRequest } from 'fastify';
import { User, Role as PrismaRole } from '../prisma/prisma.service';
import { z } from 'zod';

export type Role = PrismaRole;

// New interface for OAuth query parameters
export interface OAuthQuerystring {
  cli_port?: string;
  state?: string;
}

// DTOs for authentication
export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
  phone_number?: string;
  role?: Role;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateJwtUserDto {
  id?: string;
  sub: string; // User ID
  email: string;
  name?: string;
  phone_number?: string;
  role: Role;
  image?: string;
  provider?: string;
  tokens?: Record<string, any>;
  username?: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface VerifyEmailDto {
  token: string;
}

export interface LoginResponseDto {
  access_token: string;
  refresh_token: string;
  user: CreateJwtUserDto;
}

export interface AuthResponseDto {
  access_token: string;
  user: CreateJwtUserDto;
}

export interface AuthRequest extends FastifyRequest {
  user: {
    profile: GoogleProfileDto | GitHubProfileDto;
    tokens: GoogleTokenDto | GitHubTokenDto;
  };
}

// OAuth Profile DTOs
export interface GoogleNameDto {
  familyName?: string;
  givenName?: string;
}

export interface GoogleEmailDto {
  value: string;
  verified?: boolean;
}

export interface GooglePhotoDto {
  value: string;
}

export interface GoogleProfileDto {
  id: string;
  displayName?: string;
  name?: GoogleNameDto;
  emails?: GoogleEmailDto[];
  photos?: GooglePhotoDto[];
  provider?: string;
}

export interface GoogleTokenDto {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number;
  scope?: string;
  tokenType?: string;
}

export interface GitHubProfileDto {
  id: string;
  login: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  provider?: string;
}

export interface GitHubTokenDto {
  accessToken: string;
  refreshToken?: string;
  scope?: string;
  tokenType?: string;
}

export interface OAuthProfile {
  id: string;
  email: string;
  name?: string;
  image?: string;
  login?: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number;
  scope?: string;
  tokenType?: string;
}

// JWT Payload
export interface JwtPayload {
  sub: string; // user.id
  email: string;
  role: Role;
  name?: string;
  provider?: 'google' | 'github';
}

// Zod schemas for validation
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().optional(),
  phone_number: z.string().optional(),
  role: z.nativeEnum(PrismaRole).default(PrismaRole.USER).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});
