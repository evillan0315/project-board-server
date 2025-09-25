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

export class CreateVideoHistoryDto {
  @ApiProperty({ description: 'playedAt field' })
  @IsDate()
  playedAt: Date;
  @ApiProperty({ description: 'progress field' })
  @IsOptional()
  @IsInt()
  progress: number;
  @ApiProperty({ description: 'videoId field' })
  @IsString()
  videoId: string;
}

export class PaginationVideoHistoryResultDto {
  @ApiProperty({ type: [CreateVideoHistoryDto] })
  items: CreateVideoHistoryDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationVideoHistoryQueryDto {
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
  @Type(() => Date)
  @IsDate()
  @ApiPropertyOptional({ description: 'Filter by playedAt' })
  playedAt?: Date;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ description: 'Filter by progress' })
  progress?: number;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by videoId' })
  videoId?: string;
}
