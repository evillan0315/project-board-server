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

export class CreateGeminiResponseDto {
  @ApiProperty({ description: 'requestId field' })
  @IsString()
  requestId: string;
  @ApiProperty({ description: 'responseText field' })
  @IsString()
  responseText: string;
  @ApiProperty({ description: 'finishReason field' })
  @IsOptional()
  @IsString()
  finishReason: string;
  @ApiProperty({ description: 'safetyRatings field' })
  @IsOptional()
  @IsObject()
  safetyRatings: any;
  @ApiProperty({ description: 'tokenCount field' })
  @IsOptional()
  @IsInt()
  tokenCount: number;
}

export class PaginationGeminiResponseResultDto {
  @ApiProperty({ type: [CreateGeminiResponseDto] })
  items: CreateGeminiResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationGeminiResponseQueryDto {
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
  @ApiPropertyOptional({ description: 'Filter by responseText' })
  responseText?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by finishReason' })
  finishReason?: string;
  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter by safetyRatings' })
  safetyRatings?: any;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ description: 'Filter by tokenCount' })
  tokenCount?: number;
}
