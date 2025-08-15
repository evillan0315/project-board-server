// src/auth/dto/google-token.dto.ts
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleTokenDto {
  @ApiProperty({ example: 'ya29.a0AVvZVt...' })
  @IsString()
  accessToken: string;

  @ApiPropertyOptional({ example: '1//0gJ7xyz...' })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiPropertyOptional({ example: 'eyJhbGciOiJSUzI1NiIsInR...' })
  @IsOptional()
  @IsString()
  idToken?: string;

  @ApiPropertyOptional({ example: 1715881745 })
  @IsOptional()
  @IsNumber()
  expiresAt?: number;

  @ApiPropertyOptional({ example: 'profile email' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ example: 'Bearer' })
  @IsOptional()
  @IsString()
  tokenType?: string;
}
