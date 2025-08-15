 // src/file/dto/scan-project.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class ScanFileDto {
  @ApiProperty({
    description: 'An array of paths (relative or absolute) to scan. Each path can be a directory or a file. Defaults to ["."].',
    example: ['.', 'src/components', 'package.json'],
    type: [String],
    required: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  scanPaths: string[];

  @ApiProperty({
    description: 'The root directory of the project, used for calculating relative paths. Defaults to process.cwd() if not provided.',
    example: '/home/user/my-project',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  projectRoot?: string;

  @ApiProperty({
    description: 'If true, logs detailed information during scanning.',
    example: false,
    type: Boolean,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  verbose?: boolean;
}

export class ScannedFileDto {
  @ApiProperty({ description: 'Absolute path of the file', example: '/app/src/main.ts' })
  filePath: string;

  @ApiProperty({ description: 'Path relative to the project root', example: 'src/main.ts' })
  relativePath: string;

  @ApiProperty({ description: 'Content of the file', example: 'console.log("Hello, world!");' })
  content: string;
}
