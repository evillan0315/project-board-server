import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1; // Default to page 1

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100) // Max limit to prevent overly large requests
  @Type(() => Number)
  limit?: number = 10; // Default to 10 items per page
}
