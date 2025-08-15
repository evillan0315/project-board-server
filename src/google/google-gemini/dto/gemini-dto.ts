import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO for a simple text-only Gemini request.
 */
export class GenerateTextDto {
  @ApiProperty({
    description: 'The prompt text to send to the Gemini model.',
    example: 'Write a short story about a brave knight.',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;
}

/**
 * DTO for a Gemini request with text and a Base64 encoded image.
 */
export class GenerateImageBase64Dto {
  @ApiProperty({
    description:
      'The prompt text to send to the Gemini model, accompanying the image.',
    example: 'Describe this image.',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiProperty({
    description:
      'Base64 encoded image data (e.g., "data:image/jpeg;base64,...").',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAAY...',
  })
  @IsString()
  @IsNotEmpty()
  base64Image: string;

  @ApiProperty({
    description: 'MIME type of the image (e.g., "image/jpeg", "image/png").',
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  mimeType: string;
}

/**
 * DTO for a Gemini request with text and an uploaded file.
 * The file itself is handled by @nestjs/platform-express's FileInterceptor.
 */
export class GenerateFileDto {
  @ApiProperty({
    description:
      'The prompt text to send to the Gemini model, accompanying the file.',
    example: 'Analyze this SQL schema and provide insights.',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  // Note: The file itself is not part of this DTO's class properties,
  // as it's handled separately by the Multer interceptor.
  // We'll use @ApiProperty() and @ApiConsumes() on the controller method
  // to document the file upload.
}
