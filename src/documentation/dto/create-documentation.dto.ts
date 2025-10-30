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

export class CreateDocumentationDto {
  @ApiProperty({ description: 'name field' })
    @IsString()
    name: string;
  @ApiProperty({ description: 'content field' })
    @IsString()
    content: string;



}

export class PaginationDocumentationResultDto {
  @ApiProperty({ type: [CreateDocumentationDto] })
  items: CreateDocumentationDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationDocumentationQueryDto {
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
  
  @ApiPropertyOptional({ description: 'Filter by content' })
  content?: string;



}

