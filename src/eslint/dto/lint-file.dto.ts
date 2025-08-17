import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LintFileDto {
  @ApiProperty({
    description: 'The code content of the file to lint',
    example: 'const x = 1;',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description:
      'The virtual file path for this code content, used by ESLint to find configs/determine language. Relative to CWD.',
    example: 'src/components/MyComponent.tsx',
  })
  @IsString()
  @IsNotEmpty()
  filePath: string;
}
