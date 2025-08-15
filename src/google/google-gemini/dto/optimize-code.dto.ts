import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OutputFormat } from '../output-format.enum';

export class OptimizeCodeDto {
  @ApiProperty({
    description: 'The code snippet to optimize for performance or readability',
    example: `function add(a, b) { return a + b; }`,
  })
  @IsNotEmpty()
  @IsString()
  codeSnippet: string;

  @ApiProperty({
    description: 'Optional programming language of the code snippet',
    example: 'JavaScript',
    required: false,
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({
    description: 'Preferred output format of the optimized code',
    example: OutputFormat.Markdown,
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
