import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OutputFormat } from '../output-format.enum';

export class RepairCodeDto {
  @ApiProperty({
    description:
      'The code snippet to repair by fixing syntax or logical errors',
    example: `functon greet() { console.log("Hello") }`, // Intentionally erroneous
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
    description: 'Preferred output format of the repaired code',
    example: OutputFormat.Json,
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
