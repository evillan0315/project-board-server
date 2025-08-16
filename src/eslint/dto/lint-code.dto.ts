// src/eslint/dto/lint-code.dto.ts
import { IsString, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Import for Swagger documentation

export class LintCodeDto {
  @ApiProperty({
    description: 'The code content to lint',
    example: 'const x = 1;',
  })
  @IsString()
  @IsNotEmpty()
  code: string; // The code content to lint

  @ApiProperty({
    description:
      'Optional: The file path, used by ESLint to find configs/determine language. Relative to CWD.',
    example: 'src/app.ts',
    required: false,
  })
  @IsString()
  @IsOptional()
  filePath?: string; // Optional: The file path, used by ESLint to find configs/determine language

  @ApiProperty({
    description:
      'Optional: The current working directory from which ESLint should resolve configurations and plugins.',
    example: '/path/to/project/root',
    required: false,
  })
  @IsString()
  @IsOptional()
  cwd?: string; // Optional: The current working directory for ESLint to resolve configs
}
