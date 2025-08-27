// src/utils/json-fix/dto/json-output.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JsonOutputDto {
  @ApiProperty({
    description: 'Indicates if the JSON is valid (or successfully repaired).',
    example: true,
  })
  valid: boolean;

  @ApiPropertyOptional({
    description: 'Array of validation or repair errors (if any).',
    type: [Object],
    example: ['Unexpected token at position 5'],
  })
  errors?: (string | Record<string, any>)[];

  @ApiPropertyOptional({
    description:
      'The repaired JSON string (only returned by the repair endpoint if successful).',
    example: '{"foo": "bar"}',
  })
  repairedJson?: string;
}
