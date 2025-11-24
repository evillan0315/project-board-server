import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateCoverLetterDto {
  @ApiProperty({
    description:
      'The plain text content of the resume to be used as context for the cover letter.',
    example:
      'John Doe\nSoftware Engineer\nExperience:\n- Developed X using Y...\nSkills: Z',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  resumeContent: string;

  @ApiProperty({
    description:
      'The full plain text job description the cover letter should be tailored to.',
    example:
      'We are looking for a software engineer with strong React and Node.js skills...',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  jobDescription: string;

  @ApiProperty({
    description:
      'Optional: A specific prompt to guide the AI on the tone, focus, or style of the cover letter (e.g., "emphasize leadership skills", "write a concise letter").',
    example:
      'Focus on my experience with cloud platforms and scalable architectures.',
    required: false,
  })
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiProperty({
    description:
      'Optional: Custom system instruction to guide the AI model for nuanced cover letter generation. Overrides default instructions.',
    example:
      'Generate a cover letter strictly in a formal tone, without any informal language.',
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
