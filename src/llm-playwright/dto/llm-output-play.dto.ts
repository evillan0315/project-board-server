// FilePath: src/playwright/dto/llm-output-play.dto.ts
// Title: LLM Output Playwright DTO
// Reason: Defines the AI analysis DTO for Playwright outputs without circular dependency

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LlmOutputDto } from '../../llm/dto/llm-output.dto'; // LLM base DTO
import type { PlaywrightOutputDto } from './playwright-output.dto'; // type-only import to avoid circular dependency

export class LlmOutputPlayDto extends PartialType(LlmOutputDto) {
  @ApiPropertyOptional({
    description:
      'Optional: Raw output from Playwright operations, if applicable.',
    type: () => Object, // Avoids circular Swagger reference
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  playwrightOutput?: PlaywrightOutputDto;
}
