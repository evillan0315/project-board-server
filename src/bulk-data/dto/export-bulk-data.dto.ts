import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn, IsEnum } from 'class-validator';

export enum ExportFormat {
  JSON = 'json',
  SQL = 'sql',
  CSV = 'csv',
}

export class ExportBulkDataDto {
  @ApiProperty({
    enum: ExportFormat,
    example: ExportFormat.JSON,
    description: 'The format in which to export the data.',
  })
  @IsEnum(ExportFormat)
  format: ExportFormat;
}
