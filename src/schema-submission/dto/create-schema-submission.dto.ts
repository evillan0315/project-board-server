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

export class CreateSchemaSubmissionDto {
  @ApiProperty({ description: 'schemaName field' })
  @IsString()
  schemaName: string;
  @ApiProperty({ description: 'submittedById field' })
  @IsString()
  submittedById: string;
  @ApiProperty({ description: 'data field' })
  @IsObject()
  data: any;
  @ApiProperty({ description: 'schemaId field' })
  @IsString()
  schemaId: string;
}

export class PaginationSchemaSubmissionResultDto {
  @ApiProperty({ type: [CreateSchemaSubmissionDto] })
  items: CreateSchemaSubmissionDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationSchemaSubmissionQueryDto {
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
  @ApiPropertyOptional({ description: 'Filter by schemaName' })
  schemaName?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by submittedById' })
  submittedById?: string;
  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter by data' })
  data?: any;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by schemaId' })
  schemaId?: string;
}
