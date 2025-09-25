import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsBoolean,
  IsNumber,
  IsInt,
  IsDate,
  IsUUID,
  IsObject,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateMetadataDto {
  @ApiProperty({ description: 'data field' })
  @IsObject()
  data: any;
  @ApiProperty({ description: 'tags field' })
  @IsString()
  tags: string[];
  @ApiProperty({ description: 'fileId field' })
  @IsString()
  fileId: string;
}

export class PaginationMetadataResultDto {
  @ApiProperty({ type: [CreateMetadataDto] })
  items: CreateMetadataDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationMetadataQueryDto {
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

  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter by data' })
  data?: any;
  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter by tags' })
  tags?: string[];
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by fileId' })
  fileId?: string;
}
