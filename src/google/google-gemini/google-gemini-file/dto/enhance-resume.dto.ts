// src/google/google-gemini/google-gemini-file/dto/enhance-resume.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Import ApiProperty

export class EnhanceResumeDto {
  @ApiProperty({
    description: 'The full plain text content of the resume to be enhanced.',
    example:
      'John Doe\nSoftware Engineer\nExperience:\n- Developed X using Y...\nSkills: Z',
    minLength: 1, // Reflects IsNotEmpty validation
  })
  @IsString()
  @IsNotEmpty()
  resumeContent: string; // The full resume text

  @ApiProperty({
    description:
      'Optional: A specific section of the resume to focus the enhancement on (e.g., "summary", "experience", "skills").',
    example: 'Experience',
    required: false,
  })
  @IsOptional()
  @IsString()
  sectionToEnhance?: string; // e.g., "summary", "experience", "skills" - helps AI focus

  @ApiProperty({
    description:
      'Optional: A specific goal or instruction for the enhancement (e.g., "make more concise", "add metrics", "target leadership roles").',
    example:
      'Make the experience section more action-oriented with quantifiable results.',
    required: false,
  })
  @IsOptional()
  @IsString()
  enhancementGoal?: string; // Specific goal, e.g., "make more concise", "add metrics", "target leadership"

  @ApiProperty({
    description:
      'Optional: Custom system instruction to guide the AI model for nuanced enhancement requests. Overrides default instructions.',
    example:
      'Ensure all bullet points start with strong action verbs and highlight agile methodologies.',
    required: false,
  })
  @IsOptional()
  @IsString()
  systemInstruction?: string; // Custom system instruction for specific enhancement nuances

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
