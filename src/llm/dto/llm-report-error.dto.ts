import {
  IsString,
  IsDefined,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProposedFileChangeDto } from './llm-output.dto';

/**
 * Defines the contextual information for an LLM error report.
 */
export class LlmReportErrorContextDto {
  @ApiPropertyOptional({
    description: 'The original user prompt that led to the failed generation.',
    example: 'Generate a new feature for user management.',
  })
  @IsString()
  @IsOptional()
  originalUserPrompt?: string;

  @ApiPropertyOptional({
    description: 'The system instructions used for the initial generation.',
    example: 'Return output in JSON format.',
  })
  @IsString()
  @IsOptional()
  systemInstruction?: string;

  @ApiPropertyOptional({
    description:
      'The proposed changes that were attempted and subsequently led to the error.',
    type: [ProposedFileChangeDto],
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProposedFileChangeDto)
  @IsOptional()
  failedChanges?: ProposedFileChangeDto[];

  @ApiPropertyOptional({
    description:
      'Paths of original files that were involved in the failed operation, relative to projectRoot.',
    type: [String],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  originalFilePaths?: string[];
}

/**
 * DTO for reporting an error to the LLM for analysis and suggested fixes.
 */
export class LlmReportErrorDto {
  @ApiProperty({
    description: 'Detailed error message from the build or test failure.',
    example: 'TypeScript compilation failed: Cannot find name `foo`.',
  })
  @IsString()
  @IsDefined()
  errorDetails: string;

  @ApiProperty({
    description:
      'The absolute path to the project root directory where the error occurred.',
    example: '/home/user/my-failed-project',
  })
  @IsString()
  @IsDefined()
  projectRoot: string;

  @ApiProperty({
    description:
      'Additional context about the error, including previous LLM interactions or failed changes.',
    type: LlmReportErrorContextDto,
  })
  @IsDefined()
  @ValidateNested()
  @Type(() => LlmReportErrorContextDto)
  context: LlmReportErrorContextDto;

  @ApiPropertyOptional({
    description:
      'Optional: An array of specific file paths (relative to projectRoot) to be included for deeper analysis by the LLM, in addition to those from `context.originalFilePaths`.',
    type: [String],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  scanPaths?: string[];
}
