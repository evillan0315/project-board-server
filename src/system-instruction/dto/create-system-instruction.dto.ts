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

export class CreateSystemInstructionDto {
  @ApiProperty({ description: 'requestId field' })
  @IsString()
  requestId: string;
  @ApiProperty({ description: 'instruction field' })
  @IsString()
  instruction: string;
  @ApiProperty({ description: 'persona field' })
  @IsOptional()
  @IsString()
  persona: string;
}

export class PaginationSystemInstructionResultDto {
  @ApiProperty({ type: [CreateSystemInstructionDto] })
  items: CreateSystemInstructionDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationSystemInstructionQueryDto {
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
  @ApiPropertyOptional({ description: 'Filter by requestId' })
  requestId?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by instruction' })
  instruction?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by persona' })
  persona?: string;
}
