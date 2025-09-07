import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsMimeType } from 'class-validator';

export class TranslateContentDto {
  @ApiPropertyOptional({
    description: 'The text content to be translated.',
    example: 'Hello, world!',
    oneOf: [{ type: 'string' }],
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description:
      'Base64 encoded content of the file to be translated. Should be provided along with fileName and fileMimeType.',
    example: 'SGVsbG8sIHdvcmxkIQ==',
    oneOf: [{ type: 'string' }],
  })
  @IsOptional()
  @IsString()
  fileData?: string;

  @ApiPropertyOptional({
    description:
      'The original name of the file if fileData is provided. Used for context by the translation service.',
    example: 'document.txt',
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    description:
      'The MIME type of the file if fileData is provided (e.g., text/plain, application/pdf, application/json).',
    example: 'text/plain',
  })
  @IsOptional()
  @IsString()
  @IsMimeType()
  fileMimeType?: string;

  @ApiProperty({
    description:
      'The target language for the translation (BCP-47 language code, e.g., es, fr, ja).',
    example: 'es',
  })
  @IsNotEmpty()
  @IsString()
  targetLanguage: string;
}
