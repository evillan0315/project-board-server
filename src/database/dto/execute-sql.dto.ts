// dto/execute-sql.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ExecuteSqlDto {
  @ApiProperty({
    example: 'SELECT * FROM users;',
    description: 'SQL script to be executed.',
  })
  @IsString()
  sql: string;

  @ApiProperty({
    example: 'postgresql://user:pass@localhost:5432/db',
    required: false,
    description: 'Optional connection string. Defaults to DATABASE_URL.',
  })
  @IsOptional()
  @IsString()
  connectionString?: string;

  @ApiProperty({
    example: 'postgres',
    enum: ['postgres', 'mysql'],
    description: 'Type of the database.',
  })
  @IsString()
  dbType: 'postgres' | 'mysql';
}
