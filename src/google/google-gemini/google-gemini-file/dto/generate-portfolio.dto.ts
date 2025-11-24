import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GeneratePortfolioDto {
  @ApiProperty({
    description:
      'The plain text content of the resume to generate the portfolio from.',
    example: 'John Doe\nSoftware Engineer Experience:...',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  resumeContent: string;

  @ApiProperty({
    description:
      'Optional: A specific prompt to guide the AI on the style or focus of the portfolio (e.g., "minimalist design", "focus on machine learning projects").',
    example:
      'Generate a portfolio with a dark theme, focusing on web development projects.',
    required: false,
  })
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiProperty({
    description:
      'Optional: Custom system instruction to guide the AI model on how to generate the portfolio. Overrides default instructions.',
    example:
      'Ensure the portfolio is a single HTML file with inline CSS and no external scripts.',
    required: false,
  })
  @IsOptional()
  @IsString()
  systemInstruction?: string;

  @ApiProperty({
    description:
      'Optional: An existing conversation ID to maintain context with the AI model for continued interaction.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
