// src/utils/dto/upload-env.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
// No need for Type(() => Buffer) here, Multer handles the file object
// No need for IsNotEmpty on 'file' when it's @IsOptional() and part of an 'either-or' scenario.

export class UploadEnvDto {
  // Option 1: File Upload
  // When using @UploadedFile() with FileInterceptor, NestJS puts the Multer file object here.
  // We define it as 'any' for Multer's complex object structure, or you can use Express.Multer.File.
  @ApiPropertyOptional({
    // Use ApiPropertyOptional as the file is optional
    type: 'string',
    format: 'binary',
    description:
      'Upload your .env file via multipart/form-data. Either `file` or `filepath` must be provided.',
  })
  // Remove @IsNotEmpty() here if it's truly optional, as it will conflict.
  // Instead, the controller logic should enforce that at least one of 'file' or 'filepath' is present.
  file?: any; // Multer's file object is typically accessed directly, not via DTO validation for its existence.

  // Option 2: File Path
  @ApiPropertyOptional({
    // Use ApiPropertyOptional as the filepath is optional
    description:
      'Optional path to a local .env file on the server. Either `file` or `filepath` must be provided.',
    type: 'string',
    example: '.env.local',
  })
  @IsOptional() // filepath is optional
  @IsString()
  filepath?: string;

  // Add an API property to clarify the "either-or" requirement for Swagger UI
  @ApiProperty({
    description:
      'Indicates that either `file` (uploaded .env) or `filepath` (local path) must be provided, but not necessarily both.',
    type: 'string', // Type isn't strictly important here, just for documentation
    enum: ['file_or_filepath'], // A custom enum to hint at this requirement
    readOnly: true, // This property is just for documentation
    required: false, // It's a conceptual property for Swagger
  })
  _note_either_file_or_filepath: 'file_or_filepath'; // A dummy property for documentation
}
