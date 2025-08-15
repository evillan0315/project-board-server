import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OutputFormat } from '../output-format.enum';

export class GenerateCodeDto {
  @ApiProperty({
    description: 'The instruction or prompt for code generation',
    example: 'Create a React component that displays a user profile card.',
  })
  @IsNotEmpty()
  @IsString()
  prompt: string;

  @ApiProperty({
    description: 'Optional programming language for the generated code',
    example: 'TypeScript',
    required: false,
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({
    description: 'Optional topic or context for the code generation',
    example: 'React UI Components',
    required: false,
  })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiProperty({
    description: 'Preferred output format of the generated code',
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
