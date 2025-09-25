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

export class CreateSongDto {
  @ApiProperty({ description: 'title field' })
  @IsString()
  title: string;
  @ApiProperty({ description: 'duration field' })
  @IsInt()
  duration: number;
  @ApiProperty({ description: 'year field' })
  @IsOptional()
  @IsInt()
  year: number;
  @ApiProperty({ description: 'artistId field' })
  @IsString()
  artistId: string;
  @ApiProperty({ description: 'albumId field' })
  @IsOptional()
  @IsString()
  albumId: string;
}

export class PaginationSongResultDto {
  @ApiProperty({ type: [CreateSongDto] })
  items: CreateSongDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationSongQueryDto {
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
  @ApiPropertyOptional({ description: 'Filter by title' })
  title?: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ description: 'Filter by duration' })
  duration?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ description: 'Filter by year' })
  year?: number;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by artistId' })
  artistId?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by albumId' })
  albumId?: string;
}
