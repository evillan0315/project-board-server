// src/google-gemini/dto/optimize-resume.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class OptimizeResumeDto {
  @IsString()
  @IsNotEmpty()
  resumeContent: string;

  @IsString()
  @IsNotEmpty()
  jobDescription: string;

  @IsOptional()
  @IsString()
  systemInstruction?: string; // Custom system instruction for specific optimization nuances

  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
