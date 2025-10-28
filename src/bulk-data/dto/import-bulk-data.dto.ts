import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, IsEnum } from 'class-validator';

export enum ImportFormat {
  JSON = 'json',
  SQL = 'sql',
  CSV = 'csv',
}

export class ImportBulkDataDto {
  @ApiProperty({
    enum: ImportFormat,
    example: ImportFormat.JSON,
    description: 'The format of the data to be imported.',
  })
  @IsEnum(ImportFormat)
  format: ImportFormat;

  @ApiProperty({
    type: 'string',
    example: 'User', // Added modelName to DTO
    description:
      'The name of the Prisma model/database table to import data into.',
  })
  @IsString()
  modelName: string;

  @ApiProperty({
    description:
      'The data string to be imported (JSON, SQL, or CSV content). Required if no file is uploaded and for non-SQL formats.',
    examples: {
      json: {
        summary: 'JSON Array Example',
        value: JSON.stringify(
          [
            { name: 'John Doe', email: 'john.doe@example.com', age: 30 },
            { name: 'Jane Smith', email: 'jane.smith@example.com', age: 25 },
          ],
          null,
          2,
        ),
      },
      sql: {
        summary: 'SQL Insert/DDL Example',
        value:
          "CREATE TABLE IF NOT EXISTS `new_table` (id SERIAL PRIMARY KEY, name VARCHAR(255));\nINSERT INTO `users` (`name`, `email`, `age`) VALUES ('Alice', 'alice@example.com', 28);",
      },
      csv: {
        summary: 'CSV Data Example',
        value:
          'name,email,age\nAlice,alice@example.com,28\nBob,bob@example.com,35',
      },
    },
    required: false,
  })
  @IsString()
  @IsOptional()
  data?: string;
}
