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

export class CreateFileDto {
  @IsString()
  @ApiProperty({ description: 'Path to file or directory', required: true })
  filePath: string;

  @ApiProperty({
    description: 'Whether this is a directory',
    default: false,
  })
  isDirectory: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Optional content for the file (ignored if directory)',
    required: false,
  })
  content?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Whether it is a folder or a file.',
    default: 'file',
    required: false,
  })
  type?: string;
}
export class PaginationFileResultDto {
  @ApiProperty({ type: [CreateFileDto] })
  items: CreateFileDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationFileQueryDto {
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
