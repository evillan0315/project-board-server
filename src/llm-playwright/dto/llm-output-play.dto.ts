import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LlmOutputDto } from '../../llm/dto/llm-output.dto'; // LLM base DTO
import type { PlaywrightOutputDto } from './playwright-output.dto'; // type-only import to avoid circular dependency

/**
 * Interface for structured image analysis results.
 * Can be extended with more specific fields as needed.
 */
interface IImageAnalysisResult {
  caption?: string;
  tags?: string[];
  // Add other relevant properties if known from Gemini Image API
  [key: string]: any; // Allow for flexible additional content
}

export class LlmOutputPlayDto extends PartialType(LlmOutputDto) {
  @ApiPropertyOptional({
    description:
      'Optional: Raw output from Playwright operations, if applicable.',
    type: () => Object, // Avoids circular Swagger reference for runtime class generation
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  playwrightOutput?: PlaywrightOutputDto;

  @ApiPropertyOptional({
    description: 'Results of the Gemini AI image analysis, if performed.',
    type: () => Object, // Represents IImageAnalysisResult, using Object for Swagger type compatibility
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object) // Ensures the assigned value is treated as an object for validation/transformation
  imageAnalysis?: IImageAnalysisResult;
}
