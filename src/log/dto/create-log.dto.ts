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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateLogDto {
  @ApiProperty({ description: 'Type of log entry' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Log level (e.g., INFO, ERROR, DEBUG)' })
  @IsString()
  level: string;

  @ApiProperty({ description: 'Tags associated with the log', type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ description: 'Structured log data' })
  @IsObject()
  data: any;
}

export class PaginationLogQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @ApiPropertyOptional({ default: 1 })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @ApiPropertyOptional({ default: 10 })
  pageSize?: number = 10;
}
