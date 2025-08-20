import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class JsonInputDto {
  @ApiProperty({
    example: '{ "foo": "bar" }', // Valid JSON example
    description: 'Raw JSON input (can be malformed for repair, or valid for validation)',
  })
  @IsString()
  json: string;

  @ApiProperty({
    example:
      '{ "type": "object", "properties": { "foo": { "type": "string" }, "count": { "type": "number" }}}',
    description: 'Optional JSON Schema for validation',
    required: false,
  })
  @IsOptional()
  @IsString()
  schema?: string;
}
