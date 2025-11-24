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

export class CreateFileChangeDto {
  @ApiProperty({ description: 'planId field' })
  @IsString()
  planId: string;
  @ApiProperty({ description: 'index field' })
  @IsOptional()
  @IsInt()
  index: number;
  @ApiProperty({ description: 'filePath field' })
  @IsString()
  filePath: string;
  @ApiProperty({ description: 'reason field' })
  @IsOptional()
  @IsString()
  reason: string;
  @ApiProperty({ description: 'diff field' })
  @IsOptional()
  @IsString()
  diff: string;
  @ApiProperty({ description: 'oldContent field' })
  @IsOptional()
  @IsString()
  oldContent: string;
  @ApiProperty({ description: 'newContent field' })
  @IsOptional()
  @IsString()
  newContent: string;
  @ApiProperty({ description: 'testsAdded field' })
  @IsString()
  testsAdded: string[];
  @ApiProperty({ description: 'estimatedMinutes field' })
  @IsOptional()
  @IsInt()
  estimatedMinutes: number;
}

export class PaginationFileChangeResultDto {
  @ApiProperty({ type: [CreateFileChangeDto] })
  items: CreateFileChangeDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationFileChangeQueryDto {
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
  @ApiPropertyOptional({ description: 'Filter by planId' })
  planId?: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ description: 'Filter by index' })
  index?: number;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by filePath' })
  filePath?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by reason' })
  reason?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by diff' })
  diff?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by oldContent' })
  oldContent?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by newContent' })
  newContent?: string;
  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter by testsAdded' })
  testsAdded?: string[];
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ description: 'Filter by estimatedMinutes' })
  estimatedMinutes?: number;
}
