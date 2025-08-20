import { ApiProperty } from '@nestjs/swagger';

export class JsonOutputDto {
  @ApiProperty({
    example: true,
    description: 'Indicates if the JSON is valid or if the repair was successful.',
  })
  valid: boolean;

  @ApiProperty({
    required: false,
    // Using 'any'[] because Ajv errors are objects and general parsing errors are strings.
    example: [
      'Unexpected token } in JSON at position 14',
      {
        instancePath: '/age',
        schemaPath: '#/properties/age/type',
        keyword: 'type',
        params: { type: 'number' },
        message: 'must be number',
      },
    ],
    description: 'Array of error messages or error objects if validation or repair failed.',
  })
  errors?: any[]; // Changed to any[] to accommodate both string and AJV error objects

  @ApiProperty({
    required: false,
    example: '{\n  "foo": "bar"\n}', // Example showing pretty-printed JSON
    description:
      'The repaired JSON string, present only if repair was successful and input was repairable.',
  })
  repaired?: string;
}
