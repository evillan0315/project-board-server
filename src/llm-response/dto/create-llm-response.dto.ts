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

export class CreateLlmResponseDto {
  @ApiProperty({ description: 'title field' })
    @IsString()
    title: string;
  @ApiProperty({ description: 'summary field' })
    @IsString()
    summary: string;
  @ApiProperty({ description: 'thoughtProcess field' })
    @IsOptional()
    @IsString()
    thoughtProcess: string;
  @ApiProperty({ description: 'projectRoot field' })
    @IsString()
    projectRoot: string;
  @ApiProperty({ description: 'requestId field' })
    @IsString()
    requestId: string;
  @ApiProperty({ description: 'documentationId field' })
    @IsString()
    documentationId: string;
  @ApiProperty({ description: 'gitInstructions field' })
    @IsString()
    gitInstructions: string[];



}

export class PaginationLlmResponseResultDto {
  @ApiProperty({ type: [CreateLlmResponseDto] })
  items: CreateLlmResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationLlmResponseQueryDto {
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
  
  @ApiPropertyOptional({ description: 'Filter by title' })
  title?: string;
  @IsOptional()
  
  @IsString()
  
  @ApiPropertyOptional({ description: 'Filter by summary' })
  summary?: string;
  @IsOptional()
  
  @IsString()
  
  @ApiPropertyOptional({ description: 'Filter by thoughtProcess' })
  thoughtProcess?: string;
  @IsOptional()
  
  @IsString()
  
  @ApiPropertyOptional({ description: 'Filter by projectRoot' })
  projectRoot?: string;
  @IsOptional()
  
  @IsString()
  
  @ApiPropertyOptional({ description: 'Filter by requestId' })
  requestId?: string;
  @IsOptional()
  
  @IsString()
  
  @ApiPropertyOptional({ description: 'Filter by documentationId' })
  documentationId?: string;
  @IsOptional()
  
  @ApiPropertyOptional({ description: 'Filter by gitInstructions' })
  gitInstructions?: string[];



}

