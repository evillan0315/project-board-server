import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class GenerateTextDto {
  @ApiProperty({
    description: 'The prompt text to send to the Gemini model.',
    example: 'Write a short story about a brave knight.',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiProperty({
    description:
      "Optional system instruction to guide the model's behavior (e.g., persona or style). If provided for a new conversation, it will be used for subsequent requests in that conversation.",
    example:
      'Act as a seasoned cybersecurity expert and explain common phishing techniques.',
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
