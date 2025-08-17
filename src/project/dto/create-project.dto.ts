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

export class CreateProjectDto {
  @ApiProperty({ description: 'name field' })
  @IsString()
  name: string;
  @ApiProperty({ description: 'description field' })
  @IsOptional()
  @IsString()
  description: string;
  @ApiProperty({ description: 'path field' })
  @IsString()
  path: string;
  @ApiProperty({ description: 'technologies field' })
  @IsString()
  technologies: string[];
  @ApiProperty({ description: 'versionControl field' })
  @IsOptional()
  @IsString()
  versionControl: string;
  @ApiProperty({ description: 'repositoryUrl field' })
  @IsOptional()
  @IsString()
  repositoryUrl: string;
  @ApiProperty({ description: 'lastOpenedAt field' })
  @IsOptional()
  @IsDate()
  lastOpenedAt: Date;
  @ApiProperty({ description: 'ownerId field' })
  @IsOptional()
  @IsString()
  ownerId: string;
  @ApiProperty({ description: 'metadata field' })
  @IsOptional()
  @IsObject()
  metadata: any;
}

export class PaginationProjectResultDto {
  @ApiProperty({ type: [CreateProjectDto] })
  items: CreateProjectDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationProjectQueryDto {
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
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by path' })
  path?: string;
  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter by technologies' })
  technologies?: string[];
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by versionControl' })
  versionControl?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by repositoryUrl' })
  repositoryUrl?: string;
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @ApiPropertyOptional({ description: 'Filter by lastOpenedAt' })
  lastOpenedAt?: Date;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by ownerId' })
  ownerId?: string;
  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter by metadata' })
  metadata?: any;
}
