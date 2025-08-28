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
    description: 'The data string to be imported (JSON, SQL, or CSV content). Required if no file is uploaded.',
    examples: {
      json: {
        summary: 'JSON Array Example',
        value: JSON.stringify([
          { name: 'John Doe', email: 'john.doe@example.com', age: 30 },
          { name: 'Jane Smith', email: 'jane.smith@example.com', age: 25 },
        ], null, 2),
      },
      sql: {
        summary: 'SQL Insert Example',
        value: "INSERT INTO `users` (`name`, `email`, `age`) VALUES ('Alice', 'alice@example.com', 28);\nINSERT INTO `users` (`name`, `email`, `age`) VALUES ('Bob', 'bob@example.com', 35);",
      },
      csv: {
        summary: 'CSV Data Example',
        value: "name,email,age\nAlice,alice@example.com,28\nBob,bob@example.com,35",
      },
    },
    required: false, // Data can come from file upload
  })
  @IsString()
  @IsOptional() // Data can be provided via file upload instead
  data?: string;
}
