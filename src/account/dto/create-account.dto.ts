import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsBoolean,
  IsNumber,
  IsInt,
  IsDate,
  IsUUID,
  IsObject,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateAccountDto {
  @ApiProperty({ description: 'type field' })
  @IsString()
  type: string;
  @ApiProperty({ description: 'provider field' })
  @IsString()
  provider: string;
  @ApiProperty({ description: 'providerAccountId field' })
  @IsString()
  providerAccountId: string;
  @ApiProperty({ description: 'refresh_token field' })
  @IsOptional()
  @IsString()
  refresh_token: string;
  @ApiProperty({ description: 'access_token field' })
  @IsOptional()
  @IsString()
  access_token: string;
  @ApiProperty({ description: 'expires_at field' })
  @IsOptional()
  @IsInt()
  expires_at: number;
  @ApiProperty({ description: 'token_type field' })
  @IsOptional()
  @IsString()
  token_type: string;
  @ApiProperty({ description: 'scope field' })
  @IsOptional()
  @IsString()
  scope: string;
  @ApiProperty({ description: 'id_token field' })
  @IsOptional()
  @IsString()
  id_token: string;
  @ApiProperty({ description: 'session_state field' })
  @IsOptional()
  @IsString()
  session_state: string;
}

export class PaginationAccountResultDto {
  @ApiProperty({ type: [CreateAccountDto] })
  items: CreateAccountDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationAccountQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @ApiPropertyOptional({ default: 1 })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @ApiPropertyOptional({ default: 10 })
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by type' })
  type?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by provider' })
  provider?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by providerAccountId' })
  providerAccountId?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by refresh_token' })
  refresh_token?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by access_token' })
  access_token?: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ description: 'Filter by expires_at' })
  expires_at?: number;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by token_type' })
  token_type?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by scope' })
  scope?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by id_token' })
  id_token?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by session_state' })
  session_state?: string;
}
