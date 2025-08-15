import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OutputFormat } from '../output-format.enum';

export class AnalyzeCodeDto {
  @ApiProperty({
    description:
      'The code snippet to analyze for issues, improvements, or best practices',
    example: `let total = 0; for (let i = 0; i < items.length; i++) { total += items[i]; }`,
  })
  @IsNotEmpty()
  @IsString()
  codeSnippet: string;

  @ApiProperty({
    description: 'Optional programming language of the code snippet',
    example: 'TypeScript',
    required: false,
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({
    description: 'Preferred output format of the code analysis',
    example: OutputFormat.Text,
    enum: OutputFormat,
    default: OutputFormat.Text,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(Object.values(OutputFormat), {
    message: "Output must be one of 'markdown', 'json', 'html', 'text'",
  })
  output?: OutputFormat;
}
