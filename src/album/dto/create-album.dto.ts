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

export class CreateAlbumDto {
  @ApiProperty({ description: 'title field' })
  @IsString()
  title: string;
  @ApiProperty({ description: 'releaseDate field' })
  @IsOptional()
  @IsDate()
  releaseDate: Date;
  @ApiProperty({ description: 'coverArt field' })
  @IsOptional()
  @IsString()
  coverArt: string;
  @ApiProperty({ description: 'artistId field' })
  @IsString()
  artistId: string;
}

export class PaginationAlbumResultDto {
  @ApiProperty({ type: [CreateAlbumDto] })
  items: CreateAlbumDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationAlbumQueryDto {
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
  @Type(() => Date)
  @IsDate()
  @ApiPropertyOptional({ description: 'Filter by releaseDate' })
  releaseDate?: Date;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by coverArt' })
  coverArt?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by artistId' })
  artistId?: string;
}
