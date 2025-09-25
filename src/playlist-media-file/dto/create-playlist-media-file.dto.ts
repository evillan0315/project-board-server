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

export class CreatePlaylistMediaFileDto {
  @ApiProperty({ description: 'playlistId field' })
  @IsString()
  playlistId: string;
  @ApiProperty({ description: 'fileId field' })
  @IsString()
  fileId: string;
  @ApiProperty({ description: 'order field' })
  @IsInt()
  order: number;
}

export class PaginationPlaylistMediaFileResultDto {
  @ApiProperty({ type: [CreatePlaylistMediaFileDto] })
  items: CreatePlaylistMediaFileDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationPlaylistMediaFileQueryDto {
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
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by playlistId' })
  playlistId?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by fileId' })
  fileId?: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ description: 'Filter by order' })
  order?: number;
}
