import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMimeType,
  IsBase64,
  IsUUID,
} from 'class-validator';

export class GenerateImageBase64Dto {
  @ApiProperty({
    description: 'The prompt text to accompany the image.',
    example: 'Describe this image.',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiProperty({
    description:
      'The Base64 encoded image data (without "data:image/jpeg;base64," prefix).',
    example:
      'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
  })
  @IsString()
  @IsNotEmpty()
  @IsBase64()
  base64Image: string;

  @ApiProperty({
    description:
      'The MIME type of the image (e.g., "image/jpeg", "image/png").',
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  @IsMimeType()
  mimeType: string;

  @ApiProperty({
    description:
      "Optional system instruction to guide the model's behavior (e.g., persona or style). If provided for a new conversation, it will be used for subsequent requests in that conversation.",
    example: 'Analyze this image from a botanical perspective.',
    required: false,
  })
  @IsString()
  @IsOptional()
  systemInstruction?: string;

  @ApiProperty({
    description:
      'Optional ID of an ongoing conversation. If provided, the system instruction from the first request in this conversation will be used.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsUUID()
  conversationId?: string; // New optional field
}
