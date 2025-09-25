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

export class CreateVideoDto {
  @ApiProperty({ description: 'title field' })
  @IsString()
  title: string;
  @ApiProperty({ description: 'description field' })
  @IsString()
  description: string;
  @ApiProperty({ description: 'duration field' })
  @IsInt()
  duration: number;
  @ApiProperty({ description: 'year field' })
  @IsInt()
  year: number;
  @ApiProperty({ description: 'rating field' })
  @IsOptional()
  @IsNumber()
  rating: number;
  @ApiProperty({ description: 'director field' })
  @IsOptional()
  @IsString()
  director: string;
  @ApiProperty({ description: 'cast field' })
  @IsString()
  cast: string[];
  @ApiProperty({ description: 'resolution field' })
  @IsOptional()
  @IsString()
  resolution: string;
}

export class PaginationVideoResultDto {
  @ApiProperty({ type: [CreateVideoDto] })
  items: CreateVideoDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationVideoQueryDto {
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
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by description' })
  description?: string;
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
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ description: 'Filter by rating' })
  rating?: number;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by director' })
  director?: string;
  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter by cast' })
  cast?: string[];
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by resolution' })
  resolution?: string;
}
