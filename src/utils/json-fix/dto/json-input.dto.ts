// src/utils/json-fix/dto/json-input.dto.ts
import {
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import { IsString, IsOptional, ValidateIf } from 'class-validator';

export class JsonInputDto {
  @ApiProperty({
    description: 'The JSON string to validate or repair.',
    example: '{"foo": "bar"}',
    type: String,
  })
  @IsString()
  json: string;

  @ApiPropertyOptional({
    description:
      'Optional JSON Schema for validation (can be an object or a JSON string).',
    oneOf: [
      {
        type: 'object',
        example: {
          type: 'object',
          properties: { foo: { type: 'string' } },
          required: ['foo'],
        },
      },
      {
        type: 'string',
        example:
          '{"type":"object","properties":{"foo":{"type":"string"}},"required":["foo"]}',
      },
    ],
  })
  @IsOptional()
  schema?: Record<string, any> | string;
}
