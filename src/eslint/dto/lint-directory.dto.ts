import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LintDirectoryDto {
  @ApiProperty({
    description: 'The absolute or relative path to the directory to lint.',
    example: './src/components',
  })
  @IsString()
  @IsNotEmpty()
  directoryPath: string;

  @ApiProperty({
    description:
      'Optional: The current working directory from which ESLint should resolve configurations and plugins.',
    example: '/path/to/project/root',
    required: false,
  })
  @IsString()
  @IsOptional()
  cwd?: string;
}
