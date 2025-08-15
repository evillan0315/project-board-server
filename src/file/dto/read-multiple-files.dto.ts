// src/file/dto/read-multiple-files.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReadMultipleFilesDto {
  @ApiPropertyOptional({
    type: 'boolean',
    description: 'Return base64 blob-style data URL for each file',
  })
  generateBlobUrl?: boolean;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Optional context info (e.g., user-defined folder)',
  })
  context?: string;
}
