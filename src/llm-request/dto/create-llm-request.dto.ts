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

export class CreateLlmRequestDto {
  @ApiProperty({ description: 'userPrompt field' })
  @IsString()
  userPrompt: string;
  @ApiProperty({ description: 'projectRoot field' })
  @IsString()
  projectRoot: string;
  @ApiProperty({ description: 'scanPaths field' })
  @IsString()
  scanPaths: string[];
  @ApiProperty({ description: 'additionalInstructions field' })
  @IsString()
  additionalInstructions: string;
  @ApiProperty({ description: 'expectedOutputFormat field' })
  @IsString()
  expectedOutputFormat: string;
  @ApiProperty({ description: 'schemaId field' })
  @IsOptional()
  @IsString()
  schemaId: string;
  @ApiProperty({ description: 'schemaVersion field' })
  @IsOptional()
  @IsInt()
  schemaVersion: number;
}

export class PaginationLlmRequestResultDto {
  @ApiProperty({ type: [CreateLlmRequestDto] })
  items: CreateLlmRequestDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationLlmRequestQueryDto {
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
  @ApiPropertyOptional({ description: 'Filter by userPrompt' })
  userPrompt?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by projectRoot' })
  projectRoot?: string;
  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter by scanPaths' })
  scanPaths?: string[];
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by additionalInstructions' })
  additionalInstructions?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by expectedOutputFormat' })
  expectedOutputFormat?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by schemaId' })
  schemaId?: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ description: 'Filter by schemaVersion' })
  schemaVersion?: number;
}
