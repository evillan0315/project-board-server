import { IsString, IsArray, IsObject } from 'class-validator';
export class StoreCommandDto {
  @IsString()
  command: string;
}

// create-table.dto.ts

export class CreateTableDto {
  @IsString()
  tableName: string;

  @IsArray()
  keySchema: object[];

  @IsArray()
  attributeDefinitions: object[];

  @IsObject()
  provisionedThroughput: {
    ReadCapacityUnits: number;
    WriteCapacityUnits: number;
  };
}
