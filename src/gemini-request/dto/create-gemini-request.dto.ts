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

export class CreateGeminiRequestDto {
  @ApiProperty({ description: 'userId field' })
  @IsString()
  userId: string;
  @ApiProperty({ description: 'conversationId field' })
  @IsOptional()
  @IsString()
  conversationId: string;
  @ApiProperty({ description: 'modelUsed field' })
  @IsString()
  modelUsed: string;
  @ApiProperty({ description: 'prompt field' })
  @IsOptional()
  @IsString()
  prompt: string;
  @ApiProperty({ description: 'systemInstruction field' })
  @IsOptional()
  @IsString()
  systemInstruction: string;
  @ApiProperty({ description: 'imageUrl field' })
  @IsOptional()
  @IsString()
  imageUrl: string;
  @ApiProperty({ description: 'imageData field' })
  @IsOptional()
  @IsString()
  imageData: string;
  @ApiProperty({ description: 'fileMimeType field' })
  @IsOptional()
  @IsString()
  fileMimeType: string;
  @ApiProperty({ description: 'fileData field' })
  @IsOptional()
  @IsString()
  fileData: string;
  @ApiProperty({ description: 'files field' })
  @IsOptional()
  @IsObject()
  files: any;
}

export class PaginationGeminiRequestResultDto {
  @ApiProperty({ type: [CreateGeminiRequestDto] })
  items: CreateGeminiRequestDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationGeminiRequestQueryDto {
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
  @ApiPropertyOptional({ description: 'Filter by userId' })
  userId?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by conversationId' })
  conversationId?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by modelUsed' })
  modelUsed?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by prompt' })
  prompt?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by systemInstruction' })
  systemInstruction?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by imageUrl' })
  imageUrl?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by imageData' })
  imageData?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by fileMimeType' })
  fileMimeType?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by fileData' })
  fileData?: string;
  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter by files' })
  files?: any;
}
