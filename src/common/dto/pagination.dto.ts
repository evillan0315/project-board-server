// src/common/dto/pagination.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger'; // Import ApiPropertyOptional
import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator'; // Import IsString, IsEnum
import { Type } from 'class-transformer';
import { RequestType } from '@prisma/client'; // Import RequestType enum from Prisma client

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    type: Number,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1; // Default to page 1

  @ApiPropertyOptional({
    description: 'Number of items per page for pagination',
    type: Number,
    minimum: 1,
    maximum: 100, // Enforce max limit for Swagger documentation
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100) // Max limit to prevent overly large requests
  @Type(() => Number)
  limit?: number = 10; // Default to 10 items per page

  @ApiPropertyOptional({
    description: 'Search query to filter conversations by their first prompt.',
    type: String,
    example: 'hello world',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter conversations by the type of their first request.',
    enum: RequestType, // Use the imported RequestType enum
    example: RequestType.TEXT_ONLY,
    required: false,
  })
  @IsOptional()
  @IsEnum(RequestType) // Validate against the RequestType enum
  requestType?: RequestType;
}

