// FIlePath: src/planner/dto/generated-plan.dto.ts
// Title: DTOs for AI-generated plans and file changes
// Reason: Updated to reflect new Prisma Plan and FileChange models, including execution metadata.

import {
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
  IsOptional,
  IsDefined,
  IsInt,
  Min,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileAction } from '@prisma/client';
import { LlmInputDto } from '@/llm/dto/llm-input.dto';

export class FileChangeDto {
  @ApiPropertyOptional({ description: 'Optional order index', example: 0 })
  @IsInt()
  @IsOptional()
  index?: number;

  @ApiProperty({ description: 'File path', example: 'src/components/Welcome.tsx' })
  @IsString()
  @IsDefined()
  filePath!: string;

  @ApiProperty({ enum: FileAction, description: 'Type of file change', example: FileAction.ADD })
  @IsEnum(FileAction)
  @IsDefined()
  action!: FileAction;

  @ApiPropertyOptional({ description: 'Unified diff', example: '--- a/file.ts\n+++ b/file.ts\n@@ ...' })
  @IsString()
  @IsOptional()
  diff?: string | null;

  @ApiPropertyOptional({ description: 'Full new content for ADD/replace', example: 'import...' })
  @IsString()
  @IsOptional()
  newContent?: string | null;

  @ApiPropertyOptional({ description: 'Sample old content', example: 'const greeting = "Hi";' })
  @IsString()
  @IsOptional()
  oldContent?: string | null;

  @ApiPropertyOptional({ description: 'Reason for change', example: 'Add new component.' })
  @IsString()
  @IsOptional()
  reason?: string | null;

  @ApiPropertyOptional({ description: 'Paths to tests added', example: ['tests/components/Welcome.spec.tsx'], isArray: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  testsAdded?: string[] | null;

  @ApiPropertyOptional({ description: 'Estimated effort in minutes', example: 15 })
  @IsInt()
  @Min(0)
  @IsOptional()
  estimatedMinutes?: number;
}

export class TestsDto {
  @ApiPropertyOptional({ description: 'Added test paths', example: ['tests/add.spec.ts'], isArray: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  add?: string[];

  @ApiPropertyOptional({ description: 'Modified test paths', example: ['tests/modify.spec.ts'], isArray: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  modify?: string[];
}

export class MetadataDto {
  @ApiPropertyOptional({ description: 'Token usage estimate', example: 1234 })
  @IsOptional()
  tokensUsed?: number | string | null;
}

export class GeneratedPlanDto {
  @ApiPropertyOptional({ description: 'Plan ID', example: 'plan_01G...' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ description: 'Plan title', example: 'Implement User Auth Module' })
  @IsString()
  @IsDefined()
  title!: string;

  @ApiPropertyOptional({ description: 'Summary', example: 'Implemented Welcome component.' })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional({ description: 'Thought process', example: 'Created functional component in TS.' })
  @IsOptional()
  thoughtProcess?: string | string[];

  @ApiPropertyOptional({ description: 'Assumptions', example: ['React 18 used'], isArray: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assumptions?: string[] | string;

  @ApiPropertyOptional({ description: 'Confidence score 0-1', example: 0.85 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  confidence?: number;

  @ApiPropertyOptional({ description: 'Estimated effort in minutes', example: 45 })
  @IsInt()
  @Min(0)
  @IsOptional()
  estimatedEffortMinutes?: number;

  @ApiPropertyOptional({ description: 'Markdown documentation', example: '### Design\n...' })
  @IsString()
  @IsOptional()
  documentation?: string;


  @ApiProperty({ type: [FileChangeDto], description: 'File changes' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileChangeDto)
  @IsDefined()
  @IsOptional()
  changes: FileChangeDto[];

  @ApiPropertyOptional({ description: 'Tests summary', type: TestsDto })
  @IsOptional()
  tests?: string | string[] | null;

  @ApiPropertyOptional({ description: 'Auxiliary metadata', type: MetadataDto })
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Root path of project' })
  @IsString()
  @IsOptional()
  projectRoot?: string | null;

  @ApiPropertyOptional({ description: 'Execution status (SUCCESS/FAILURE)' })
  @IsString()
  @IsOptional()
  lastExecutionStatus?: string | null;

  @ApiPropertyOptional({ description: 'Last execution error message' })
  @IsString()
  @IsOptional()
  lastExecutionError?: string | null;

  @ApiPropertyOptional({ description: 'Last execution timestamp' })
  @IsOptional()
  lastExecutionTimestamp?: Date;

  @ApiPropertyOptional({ description: 'Optional error if LLM failed to generate plan', example: null })
  @IsString()
  @IsOptional()
  error?: string | null;

  @ApiPropertyOptional({ description: 'Optional documentation ID', example: 'doc_01G...' })
  @IsString()
  @IsOptional()
  documentationId?: string;

  @ApiPropertyOptional({ description: 'Optional ID of user who created plan', example: 'user_01G...' })
  @IsString()
  @IsOptional()
  createdById?: string | null;

  @ApiPropertyOptional({ description: 'Original LLM input', type: LlmInputDto })
  @IsOptional()
  llmInput?: LlmInputDto;

  @ApiPropertyOptional({ description: 'Plan creation timestamp' })
  @IsOptional()
  createdAt?: Date;

  @ApiPropertyOptional({ description: 'Plan last update timestamp' })
  @IsOptional()
  updatedAt?: Date;
}

