import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMimeType,
  IsBase64,
  IsBoolean,
  ValidateIf,
} from 'class-validator';

export class TranslateContentDto {
  @ApiPropertyOptional({
    description: 'The text content to be translated.',
    example: 'Hello, how are you?',
    required: false,
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.fileData)
  @IsNotEmpty({ message: 'Content or file data must be provided.' })
  content?: string;

  @ApiPropertyOptional({
    description:
      'Base64 encoded file data to be translated. Required if `content` is not provided.',
    format: 'byte',
    example: 'SGVsbG8sIHdvcmxkIQ==',
    required: false,
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.content)
  @IsBase64({}, { message: 'File data must be base64 encoded.' })
  @IsNotEmpty({ message: 'Content or file data must be provided.' })
  fileData?: string;

  @ApiPropertyOptional({
    description: 'The name of the uploaded file.',
    example: 'document.txt',
    required: false,
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !!o.fileData)
  @IsNotEmpty({ message: 'File name is required if file data is provided.' })
  fileName?: string;

  @ApiPropertyOptional({
    description: 'The MIME type of the uploaded file (e.g., text/plain, application/pdf).',
    example: 'text/plain',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsMimeType({ message: 'File MIME type must be a valid MIME type string.' })
  @ValidateIf((o) => !!o.fileData)
  @IsNotEmpty({ message: 'File MIME type is required if file data is provided.' })
  fileMimeType?: string;

  @ApiProperty({
    description: 'The target language code for translation (e.g., es, fr, de).',
    example: 'es',
  })
  @IsString()
  @IsNotEmpty()
  targetLanguage: string;

  @ApiPropertyOptional({
    description:
      'Whether to return the translation in the original file format, if fileData is provided.',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  returnInOriginalFormat?: boolean;
}
