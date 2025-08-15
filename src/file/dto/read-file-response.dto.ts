// ../file/dto/read-file-response.dto.ts

import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReadFileResponseDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'The absolute or relative path to the file on the server, if applicable (e.g., for local files).',
    example: '/path/to/your/file.ts',
    nullable: true, // Explicitly marks it as nullable in OpenAPI spec
  })
  filePath?: string; // Made optional as some files (like uploads) might not have a persistent path

  @IsString()
  @ApiProperty({
    description: 'The original filename (e.g., "document.pdf", "index.ts").',
    example: 'example.ts',
  })
  filename: string;

  @IsString()
  @ApiProperty({
    description:
      'The MIME type of the file (e.g., "text/plain", "application/json").',
    example: 'text/typescript',
  })
  mimeType: string; // Typically, MIME type is always available or defaults to 'application/octet-stream'

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'The detected programming language of the file content, if applicable (e.g., "typescript", "json", "markdown").',
    example: 'typescript',
    nullable: true,
  })
  language?: string;

  @IsString()
  @ApiProperty({
    description:
      'The content of the file. For text-based files, this is the raw text. For binary files, it is the base64-encoded string.',
    example: 'console.log("Hello World");',
  })
  content: string; // Renamed from 'data' to 'content' and made mandatory.

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'A base64 encoded data URL (blob) of the file, if requested. Format: `data:[<mediatype>][;base64],<data>`',
    example: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==',
    nullable: true,
  })
  blob?: string; // Renamed from 'data' / 'content' to 'blob' for clarity.
}
