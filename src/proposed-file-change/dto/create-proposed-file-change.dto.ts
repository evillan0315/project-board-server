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

export class CreateProposedFileChangeDto {
  @ApiProperty({ description: 'filePath field' })
    @IsString()
    filePath: string;
  @ApiProperty({ description: 'newContent field' })
    @IsOptional()
    @IsString()
    newContent: string;
  @ApiProperty({ description: 'reason field' })
    @IsOptional()
    @IsString()
    reason: string;
  @ApiProperty({ description: 'responseId field' })
    @IsString()
    responseId: string;



}

export class PaginationProposedFileChangeResultDto {
  @ApiProperty({ type: [CreateProposedFileChangeDto] })
  items: CreateProposedFileChangeDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationProposedFileChangeQueryDto {
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
  
  @ApiPropertyOptional({ description: 'Filter by newContent' })
  newContent?: string;
  @IsOptional()
  
  @IsString()
  
  @ApiPropertyOptional({ description: 'Filter by reason' })
  reason?: string;
  @IsOptional()
  
  @IsString()
  
  @ApiPropertyOptional({ description: 'Filter by responseId' })
  responseId?: string;



}

