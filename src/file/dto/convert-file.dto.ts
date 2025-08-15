import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileFormat } from '../file-format.enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ConvertFileDto {
  @ApiPropertyOptional({
    description: 'System/local file path to read content from',
    type: String,
  })
  @IsOptional()
  @IsString()
  filePath?: string;

  @ApiPropertyOptional({
    description: 'URL of a remote file to fetch content from',
    type: String,
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({
    description: 'Format to convert the file content to',
    enum: FileFormat,
    enumName: 'FileFormat',
  })
  @IsEnum(FileFormat)
  format: FileFormat;
}
