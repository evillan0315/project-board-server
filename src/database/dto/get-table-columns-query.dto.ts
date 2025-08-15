import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetTableColumnsQueryDto {
  @ApiProperty({
    description: 'PostgreSQL connection string',
    example: 'postgresql://user:password@localhost:5432/dbname',
  })
  @IsString()
  connectionString: string;

  @ApiProperty({
    description: 'Name of the table to inspect',
    example: 'users',
  })
  @IsString()
  tableName: string;

  @ApiPropertyOptional({
    description:
      'Filter by column name (case-insensitive, partial match supported)',
    example: 'id',
  })
  @IsOptional()
  @IsString()
  columnName?: string;

  @ApiPropertyOptional({
    description: 'Filter by data type (e.g., text, integer)',
    example: 'text',
  })
  @IsOptional()
  @IsString()
  dataType?: string;

  @ApiPropertyOptional({
    description: 'Filter by nullability ("YES" or "NO")',
    example: 'NO',
  })
  @IsOptional()
  @IsString()
  isNullable?: string;
}
