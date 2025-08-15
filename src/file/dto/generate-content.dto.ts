import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
export class GenerateContentDto {
  @ApiProperty({
    example: 'Create a login form using React',
    description: 'Content prompt to generate output from',
  })
  content: string;

  @ApiProperty({
    example: 'html',
    description:
      'Type of content to generate (e.g., html, json, markdown, documentation, tutorial)',
  })
  type: string;

  @ApiProperty({
    example: 'NestJS Project or NestJS',
    description: 'Type of topic to generate (e.g., NestJS, React, AWS)',
  })
  @IsOptional()
  topic?: string;

  @ApiProperty({
    example: 'chatId',
    description: 'Chat id',
  })
  chatId?: string;
}
