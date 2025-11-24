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

export class CreateExecutionSnapshotDto {
  @ApiProperty({ description: 'planId field' })
  @IsString()
  planId: string;
  @ApiProperty({ description: 'success field' })
  @IsBoolean()
  success: boolean;
  @ApiProperty({ description: 'error field' })
  @IsOptional()
  @IsString()
  error: string;
  @ApiProperty({ description: 'commitHash field' })
  @IsOptional()
  @IsString()
  commitHash: string;
  @ApiProperty({ description: 'appliedChanges field' })
  @IsOptional()
  @IsObject()
  appliedChanges: any;
}

export class PaginationExecutionSnapshotResultDto {
  @ApiProperty({ type: [CreateExecutionSnapshotDto] })
  items: CreateExecutionSnapshotDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationExecutionSnapshotQueryDto {
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
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Filter by success' })
  success?: boolean;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by error' })
  error?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by commitHash' })
  commitHash?: string;
  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter by appliedChanges' })
  appliedChanges?: any;
}
