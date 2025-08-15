// src/code-extractor/dto/extract-code.dto.ts
import { IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExtractCodeDto {
  @ApiProperty({
    description: 'Absolute or relative path to the markdown file to process',
    required: false,
    example: './docs/example.md',
  })
  @IsOptional()
  @IsString()
  filePath?: string;

  @ApiProperty({
    description:
      'Raw markdown content to extract code blocks from (alternative to filePath)',
    required: false,
    example: '## Example\n\n```js\nconsole.log("Hello, world!");\n```',
  })
  @IsOptional()
  @IsString()
  markdown?: string;

  @ValidateIf((o) => !o.filePath && !o.markdown)
  validate(): boolean {
    throw new Error('Either "filePath" or "markdown" must be provided.');
  }
}
