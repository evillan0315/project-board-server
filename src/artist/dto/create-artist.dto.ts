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

export class CreateArtistDto {
  @ApiProperty({ description: 'name field' })
  @IsString()
  name: string;
  @ApiProperty({ description: 'bio field' })
  @IsOptional()
  @IsString()
  bio: string;
  @ApiProperty({ description: 'image field' })
  @IsOptional()
  @IsString()
  image: string;
}

export class PaginationArtistResultDto {
  @ApiProperty({ type: [CreateArtistDto] })
  items: CreateArtistDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationArtistQueryDto {
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
  @ApiPropertyOptional({ description: 'Filter by name' })
  name?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by bio' })
  bio?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by image' })
  image?: string;
}
