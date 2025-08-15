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
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123' })
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  name: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  phone_number?: string;

  @ApiProperty({ example: 'USER', required: false })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
export class CreateJwtUserDto {
  @ApiProperty({
    description: 'JQT User identifier',
    example: '21jdh-jsdhd-jasjasd',
  })
  @IsString()
  id?: string;

  @ApiProperty({ example: '21jdh-jsdhd-jasjasd' })
  @IsString()
  sub: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  phone_number?: string;

  @ApiProperty({ example: 'USER', required: false })
  @IsOptional()
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ example: 'john.jpg', required: false })
  @IsOptional()
  image?: string;

  @ApiProperty({ example: 'Google', required: false })
  @IsOptional()
  provider?: string;

  @ApiProperty({ example: '32131dqewewqe', required: false })
  @IsOptional()
  tokens?: any;
  @ApiProperty({ example: 'user01', required: false })
  @IsOptional()
  username?: any;
}
export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123' })
  @IsNotEmpty()
  password: string;
}
