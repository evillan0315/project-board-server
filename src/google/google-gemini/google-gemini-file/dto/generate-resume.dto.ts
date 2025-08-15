// src/google/google-gemini/google-gemini-file/dto/generate-resume.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Import ApiProperty

export class GenerateResumeDto {
  @ApiProperty({
    description: 'The detailed prompt describing the resume to be generated. This should include personal details, desired job role, experience level, key skills, and any specific sections or formatting requirements.',
    example: 'Generate a resume for a senior software engineer with 10 years of experience in TypeScript, React, Node.js, and AWS. Include a strong summary, a detailed experience section with quantifiable achievements, education, and a skills section. Target roles in FinTech.',
    minLength: 1, // Reflects IsNotEmpty validation
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiProperty({
    description: 'Optional: Custom system instruction to guide the AI model on how to generate the resume (e.g., "Use a modern, minimalist design", "Focus on leadership experience"). Overrides default instructions.',
    example: 'Generate the resume strictly in JSON format, outlining each section as a separate object.',
    required: false,
  })
  @IsOptional()
  @IsString()
  systemInstruction?: string;

  @ApiProperty({
    description: 'Optional: An existing conversation ID to maintain context with the AI model for continued interaction (e.g., if refining a previously generated resume).',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  conversationId?: string;
}

