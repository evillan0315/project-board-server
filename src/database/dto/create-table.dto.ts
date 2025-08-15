// create-table.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTableColumnDto {
  @ApiProperty({ example: 'id' })
  @IsString()
  columnName: string;

  @ApiProperty({ example: 'SERIAL PRIMARY KEY' })
  @IsString()
  dataType: string;
}
class ColumnDto {
  @ApiProperty({ example: 'id' })
  @IsString()
  @IsNotEmpty()
  columnName: string;

  @ApiProperty({ example: 'integer' })
  @IsString()
  @IsNotEmpty()
  dataType: string;
}
export class CreateTableDto {
  @ApiProperty({ example: 'postgresql://user:pass@localhost:5432/db' })
  @IsString()
  @IsNotEmpty()
  connectionString: string;

  @ApiProperty({ example: 'users' })
  @IsString()
  @IsNotEmpty()
  tableName: string;

  @ApiProperty({ type: [ColumnDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnDto)
  columns: ColumnDto[];

  @ApiProperty({ example: 'postgres', enum: ['postgres', 'mysql', 'mongodb'] })
  @IsString()
  @IsIn(['postgres', 'mysql', 'mongodb'])
  dbType: 'postgres' | 'mysql' | 'mongodb';
}
