// FIlePath: src/planner/dto/generated-plan.dto.ts
// Title: DTOs for AI-generated plans and file changes
// Reason: Added `documentation` as optional string to allow null

import {
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
  IsOptional,
  IsDefined,
  IsInt,
  Min,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileAction } from '@prisma/client';
import { CreatePlanDto } from '@/plan/dto/create-plan.dto';

export class FileChangeDto {
  @ApiPropertyOptional({ description: 'Optional order index', example: 0 })
  @IsInt()
  @IsOptional()
  index?: number;

  @ApiProperty({
    description: 'File path',
    example: 'src/components/Welcome.tsx',
  })
  @IsString()
  @IsDefined()
  filePath!: string;

  @ApiProperty({
    enum: FileAction,
    description: 'Type of file change',
    example: FileAction.ADD,
  })
  @IsEnum(FileAction)
  @IsDefined()
  action!: FileAction;

  @ApiPropertyOptional({
    description: 'Unified diff',
    example: '--- a/file.ts\n+++ b/file.ts\n@@ ...',
  })
  @IsString()
  @IsOptional()
  diff?: string;

  @ApiPropertyOptional({
    description: 'Full new content for ADD/replace',
    example: 'import...',
  })
  @IsString()
  @IsOptional()
  newContent?: string;

  @ApiPropertyOptional({
    description: 'Sample old content',
    example: 'const greeting = "Hi";',
  })
  @IsString()
  @IsOptional()
  oldContent?: string;

  @ApiPropertyOptional({
    description: 'Reason for change',
    example: 'Add new component.',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Paths to tests added',
    example: ['tests/components/Welcome.spec.tsx'],
    isArray: true,
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  testsAdded?: string[];

  @ApiPropertyOptional({
    description: 'Estimated effort in minutes',
    example: 15,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  estimatedMinutes?: number;
}

export class TestsDto {
  @ApiPropertyOptional({
    description: 'Added test paths',
    example: ['tests/add.spec.ts'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  add?: string[];

  @ApiPropertyOptional({
    description: 'Modified test paths',
    example: ['tests/modify.spec.ts'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  modify?: string[];
}

export class GeneratedPlanDto extends CreatePlanDto {
  @ApiPropertyOptional({ description: 'Plan ID', example: 'plan_01G...' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ type: [FileChangeDto], description: 'File changes' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileChangeDto)
  @IsOptional()
  changes?: FileChangeDto[];

  @ApiPropertyOptional({ description: 'Tests summary', type: TestsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TestsDto)
  tests?: TestsDto;

  @ApiPropertyOptional({
    description: 'Optional documentation content',
    example: 'Full documentation text',
    nullable: true,
  })
  @IsOptional()
  documentation?: string | null;

  @ApiPropertyOptional({ description: 'Created by user ID' })
  @IsString()
  @IsOptional()
  createdById?: string;

  @ApiPropertyOptional({ description: 'Plan creation timestamp' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  createdAt?: Date;

  @ApiPropertyOptional({ description: 'Plan last update timestamp' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  updatedAt?: Date;
}
