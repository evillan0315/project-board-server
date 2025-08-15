import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsBoolean,
  IsNumber,
  IsInt,
  IsDate,
  IsObject,
  IsPositive,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReadFileDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Path to a file on the system' })
  filePath?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'URL of a file to fetch' })
  url?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Return a base64 URL Blob instead of plain text',
  })
  generateBlobUrl?: boolean;
}
