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

export class CreatePlaylistDto {
  @ApiProperty({ description: 'name field' })
  @IsString()
  name: string;
  @ApiProperty({ description: 'description field' })
  @IsOptional()
  @IsString()
  description: string;
  @ApiProperty({ description: 'isPublic field' })
  @IsBoolean()
  isPublic: boolean;
}

export class PaginationPlaylistResultDto {
  @ApiProperty({ type: [CreatePlaylistDto] })
  items: CreatePlaylistDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationPlaylistQueryDto {
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
  @ApiPropertyOptional({ description: 'Filter by description' })
  description?: string;
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Filter by isPublic' })
  isPublic?: boolean;
}
