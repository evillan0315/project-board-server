import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeleteFileDto {
  @ApiProperty({
    description: 'The absolute path of the file or directory to delete.',
    example: '/path/to/project/src/old-file.ts',
  })
  @IsString()
  @IsNotEmpty()
  filePath!: string;

  @ApiPropertyOptional({
    description: 'If true, recursively deletes directories.',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  recursive?: boolean = false;
}
