// get-tables-query.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class GetTablesQueryDto {
  @ApiProperty({ example: 'postgresql://user:pass@localhost:5432/db' })
  @IsString()
  @IsNotEmpty()
  connectionString: string;

  @ApiProperty({
    description: 'Database type',
    enum: ['postgres', 'mysql', 'mongodb'],
    example: 'postgres',
  })
  @IsString()
  @IsIn(['postgres', 'mysql', 'mongodb'])
  dbType: 'postgres' | 'mysql' | 'mongodb';
}
