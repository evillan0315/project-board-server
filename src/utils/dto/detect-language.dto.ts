// src/utils/dto/detect-language.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class DetectLanguageDto {
  @ApiProperty({
    description: 'The filename to detect the language from (e.g., "index.ts", "styles.css").',
    example: 'index.ts',
    required: false, // At least one of filename or mimeType should be provided
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty() // Ensures if provided, it's not an empty string
  filename?: string;

  @ApiProperty({
    description: 'The MIME type to detect the language from (e.g., "text/typescript", "application/json").',
    example: 'text/typescript',
    required: false, // At least one of filename or mimeType should be provided
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty() // Ensures if provided, it's not an empty string
  mimeType?: string;
}

