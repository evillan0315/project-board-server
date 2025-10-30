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

export class CreateDiffDto {
  @ApiProperty({ description: 'filePath field' })
    @IsString()
    filePath: string;
  @ApiProperty({ description: 'diff field' })
    @IsString()
    diff: string;
  @ApiProperty({ description: 'proposedFileChangeId field' })
    @IsString()
    proposedFileChangeId: string;



}

export class PaginationDiffResultDto {
  @ApiProperty({ type: [CreateDiffDto] })
  items: CreateDiffDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationDiffQueryDto {
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
  
  @ApiPropertyOptional({ description: 'Filter by filePath' })
  filePath?: string;
  @IsOptional()
  
  @IsString()
  
  @ApiPropertyOptional({ description: 'Filter by diff' })
  diff?: string;
  @IsOptional()
  
  @IsString()
  
  @ApiPropertyOptional({ description: 'Filter by proposedFileChangeId' })
  proposedFileChangeId?: string;



}

