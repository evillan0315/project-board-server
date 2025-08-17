import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LintFileDto } from './lint-file.dto';

export class LintFilesDto {
  @ApiProperty({
    type: [LintFileDto],
    description:
      'An array of file objects, each containing code content and its virtual file path.',
  })
  @IsArray()
  @ValidateNested({ each: true }) // Validate each item in the array
  @Type(() => LintFileDto)
  files: LintFileDto[];

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
