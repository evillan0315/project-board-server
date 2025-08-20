// src/auth/dto/auth.dto.ts
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Unique email address of the user',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Secure password with at least 8 characters',
    example: 'StrongPassword123',
    minLength: 8,
  })
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Phone number of the user (E.164 format recommended)',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  phone_number?: string;

  @ApiProperty({
    description: 'User role within the system',
    enum: Role,
    example: Role.USER,
    required: false,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class CreateJwtUserDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '21jdh-jsdhd-jasjasd',
  })
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Subject claim (typically user ID)',
    example: '21jdh-jsdhd-jasjasd',
  })
  @IsString()
  sub: string;

  @ApiProperty({
    description: 'Email address associated with the user',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  phone_number?: string;

  @ApiProperty({
    description: 'User role within the system',
    enum: Role,
    example: Role.USER,
    required: false,
  })
  @IsOptional()
  @IsEnum(Role)
  role: Role;

  @ApiProperty({
    description: 'Profile picture filename or URL',
    example: 'john.jpg',
    required: false,
  })
  @IsOptional()
  image?: string;

  @ApiProperty({
    description: 'Authentication provider used (e.g., Google, GitHub)',
    example: 'Google',
    required: false,
  })
  @IsOptional()
  provider?: string;

  @ApiProperty({
    description: 'Access/refresh tokens returned by the provider',
    example: {
      access_token: 'ya29.a0AfH6S...',
      refresh_token: '1//0gL8y...',
      expiry_date: 1699440000000,
    },
    required: false,
  })
  @IsOptional()
  tokens?: Record<string, any>;

  @ApiProperty({
    description: 'Unique username (if applicable)',
    example: 'user01',
    required: false,
  })
  @IsOptional()
  username?: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'User email used to log in',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password for authentication',
    example: 'StrongPassword123',
  })
  @IsNotEmpty()
  password: string;
}

/**
 * Response DTOs
 */
export class AuthUserDto {
  @ApiProperty({ example: '21jdh-jsdhd-jasjasd' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe', required: false })
  name?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  phone_number?: string;

  @ApiProperty({ enum: Role, example: Role.USER })
  role: Role;

  @ApiProperty({ example: 'john.jpg', required: false })
  image?: string;

  @ApiProperty({ example: 'user01', required: false })
  username?: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT Access Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',
  })
  access_token: string;

  @ApiProperty({
    description: 'JWT Refresh Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6REFRESH...',
  })
  refresh_token: string;

  @ApiProperty({
    description: 'Authenticated user details',
    type: CreateJwtUserDto,
  })
  user: CreateJwtUserDto;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT Access Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Authenticated user details',
    type: CreateJwtUserDto,
  })
  user: CreateJwtUserDto;
}
