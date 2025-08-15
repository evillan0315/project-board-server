import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class GenerateFileDto {
  @ApiProperty({
    description: 'The text prompt for Gemini.',
    example: 'Analyze this SQL schema and suggest improvements.',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiProperty({
    description:
      "Optional system instruction to guide the model's behavior (e.g., persona or style). If provided for a new conversation, it will be used for subsequent requests in that conversation.",
    example: 'Explain this code line by line.',
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
