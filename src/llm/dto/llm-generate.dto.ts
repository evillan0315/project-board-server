// src/llm/dto/llm-generate.dto.ts (or wherever your LllmGenerateDto resides)
import { IsDefined, IsString, IsNotEmpty, ValidateNested, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LlmInputDto } from './llm-input.dto';


export class LllmGenerateDto {
  @ApiProperty({
    description: 'Detailed input object for the LLM, including instructions and context.',
    type: LlmInputDto, 
  })
  @IsDefined()
  @ValidateNested()
  @Type(() => LlmInputDto) 
  llmInput: LlmInputDto; 

  @ApiProperty({
    description: 'The absolute path to the project root directory on the server.',
    example: '/home/user/my-project',
  })
  @IsString()
  @IsNotEmpty()
  projectRoot: string;

  @ApiPropertyOptional({
    description: 'An optional ID to track conversational context across multiple LLM calls.',
    example: 'conversation-12345',
  })
  @IsOptional()
  @IsString()
  conversationId?: string;
}
