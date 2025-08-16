// src/utils/dto/html.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class HtmlDto {
  @ApiProperty({
    description: 'The HTML content to convert to DOCX.',
    example:
      '<h1>Hello World</h1><p>This is some <strong>HTML</strong> content.</p>',
  })
  @IsString()
  @IsNotEmpty()
  html: string;
}
