import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateVideoDto {
  @ApiProperty({
    description: 'The prompt text to generate the video from.',
    example: 'A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000) // Adjust based on Veo 3.0 prompt limits if known
  prompt: string;

  @ApiProperty({
    description: 'Optional ID of an ongoing conversation to link this video generation to.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    required: false,
  })
  @IsString()
  @IsOptional()
  conversationId?: string;

  // Add any other specific parameters Veo 3.0 might support,
  // e.g., duration, style, aspect ratio, camera movement
  // For this example, we stick to just the prompt as in the provided REST example.
}

