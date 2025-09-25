import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class DropTableDto {
  @ApiProperty({ example: 'postgresql://user:pass@localhost:5432/db' })
  @IsString()
  @IsNotEmpty()
  connectionString: string;

  @ApiProperty({ example: 'users' })
  @IsString()
  @IsNotEmpty()
  tableName: string;

  @ApiProperty({ example: 'postgres', enum: ['postgres', 'mysql', 'mongodb'] })
  @IsString()
  @IsIn(['postgres', 'mysql', 'mongodb'])
  dbType: 'postgres' | 'mysql' | 'mongodb';
}
