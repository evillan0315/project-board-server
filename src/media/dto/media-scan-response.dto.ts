import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
} from 'class-validator';

export class MediaScanResponseDto {
  @ApiProperty({
    description: 'Indicates if the scan operation was successful.',
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'A message describing the outcome of the scan.' })
  @IsString()
  message: string;

  @ApiProperty({
    description:
      'The total number of new media files found and added to the database.',
  })
  @IsNumber()
  scannedFilesCount: number;

  @ApiPropertyOptional({
    description: 'An array of errors encountered during the scan, if any.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  errors?: string[];
}
