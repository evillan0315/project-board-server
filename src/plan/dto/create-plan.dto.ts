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

export class CreatePlanDto {
  @ApiProperty({ description: 'title field' })
  @IsString()
  title: string;
  @ApiProperty({ description: 'summary field' })
  @IsOptional()
  @IsString()
  summary: string;
  @ApiProperty({ description: 'thoughtProcess field' })
  @IsOptional()
  @IsString()
  thoughtProcess: string;
  @ApiProperty({ description: 'assumptions field' })
  @IsOptional()
  @IsString()
  assumptions: string;
  @ApiProperty({ description: 'estimatedEffortMinutes field' })
  @IsOptional()
  @IsInt()
  estimatedEffortMinutes: number;
  @ApiProperty({ description: 'confidence field' })
  @IsOptional()
  @IsInt()
  confidence: number;
  @ApiProperty({ description: 'documentationId field' })
  @IsOptional()
  @IsString()
  documentationId: string;
  @ApiProperty({ description: 'gitInstructions field' })
  @IsString()
  gitInstructions: string[];
  @ApiProperty({ description: 'llmRequestId field' })
  @IsOptional()
  @IsString()
  llmRequestId: string;
  @ApiProperty({ description: 'llmInput field' })
  @IsOptional()
  @IsObject()
  llmInput: any;
  @ApiProperty({ description: 'lastExecutionStatus field' })
  @IsOptional()
  @IsString()
  lastExecutionStatus: string;
  @ApiProperty({ description: 'lastExecutionError field' })
  @IsOptional()
  @IsString()
  lastExecutionError: string;
  @ApiProperty({ description: 'lastExecutionTimestamp field' })
  @IsOptional()
  @IsDate()
  lastExecutionTimestamp: Date;
  @ApiProperty({ description: 'projectRoot field' })
  @IsOptional()
  @IsString()
  projectRoot: string;
  @ApiProperty({ description: 'buildScripts field' })
  @IsOptional()
  @IsString()
  buildScripts: string;
  @ApiProperty({ description: 'metadata field' })
  @IsOptional()
  @IsObject()
  metadata: any;
  @ApiProperty({ description: 'error field' })
  @IsOptional()
  @IsString()
  error: string;
}

export class PaginationPlanResultDto {
  @ApiProperty({ type: [CreatePlanDto] })
  items: CreatePlanDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationPlanQueryDto {
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
  @ApiPropertyOptional({ description: 'Filter by assumptions' })
  assumptions?: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ description: 'Filter by estimatedEffortMinutes' })
  estimatedEffortMinutes?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ description: 'Filter by confidence' })
  confidence?: number;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by documentationId' })
  documentationId?: string;
  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter by gitInstructions' })
  gitInstructions?: string[];
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by llmRequestId' })
  llmRequestId?: string;
  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter by llmInput' })
  llmInput?: any;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by lastExecutionStatus' })
  lastExecutionStatus?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by lastExecutionError' })
  lastExecutionError?: string;
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @ApiPropertyOptional({ description: 'Filter by lastExecutionTimestamp' })
  lastExecutionTimestamp?: Date;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by projectRoot' })
  projectRoot?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by buildScripts' })
  buildScripts?: string;
  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter by metadata' })
  metadata?: any;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by error' })
  error?: string;
}
