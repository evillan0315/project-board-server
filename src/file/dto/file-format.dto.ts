import { ApiProperty } from '@nestjs/swagger';
import { FileFormat } from '../file-format.enum';
import { IsEnum } from 'class-validator';

export class FileFormatDto {
  @ApiProperty({
    description: 'The format to convert the file content to',
    enum: FileFormat,
  })
  @IsEnum(FileFormat)
  format: FileFormat;
}
