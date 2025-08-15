// src/auth/dto/github-profile.dto.ts
import {
  IsArray,
  IsOptional,
  IsString,
  IsEmail,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GitHubProfileDto {
  @ApiProperty({ example: '12345678' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'octocat' })
  @IsString()
  login: string;

  @ApiPropertyOptional({ example: 'The Octocat' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'octocat@github.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    example: 'https://avatars.githubusercontent.com/u/12345678?v=4',
  })
  @IsOptional()
  @IsUrl()
  avatar_url?: string;

  @ApiPropertyOptional({ example: 'github' })
  @IsOptional()
  @IsString()
  provider?: string;
}

export class GitHubTokenDto {
  @ApiProperty()
  @IsString()
  accessToken: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tokenType?: string;
}
