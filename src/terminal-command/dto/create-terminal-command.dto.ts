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

export class CreateTerminalCommandDto {
  @ApiProperty({ description: 'command field' })
    @IsString()
    command: string;
  @ApiProperty({ description: 'description field' })
    @IsOptional()
    @IsString()
    description: string;
  @ApiProperty({ description: 'output field' })
    @IsOptional()
    @IsString()
    output: string;
  @ApiProperty({ description: 'tags field' })
    @IsString()
    tags: string[];
  @ApiProperty({ description: 'isFavorite field' })
    @IsBoolean()
    isFavorite: boolean;



}

export class PaginationTerminalCommandResultDto {
  @ApiProperty({ type: [CreateTerminalCommandDto] })
  items: CreateTerminalCommandDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationTerminalCommandQueryDto {
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
  
  @ApiPropertyOptional({ description: 'Filter by command' })
  command?: string;
  @IsOptional()
  
  @IsString()
  
  @ApiPropertyOptional({ description: 'Filter by description' })
  description?: string;
  @IsOptional()
  
  @IsString()
  
  @ApiPropertyOptional({ description: 'Filter by output' })
  output?: string;
  @IsOptional()
  
  @ApiPropertyOptional({ description: 'Filter by tags' })
  tags?: string[];
  @IsOptional()
  
  @IsBoolean()
  
  @ApiPropertyOptional({ description: 'Filter by isFavorite' })
  isFavorite?: boolean;



}

