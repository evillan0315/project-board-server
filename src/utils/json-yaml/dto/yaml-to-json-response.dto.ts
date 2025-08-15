import { ApiProperty } from '@nestjs/swagger';

export class YamlToJsonResponseDto {
  @ApiProperty({
    description: 'The converted JSON output',
    example: {
      name: 'John Doe',
      age: 30,
      skills: ['NestJS', 'SolidJS'],
    },
  })
  json: Record<string, unknown>;

  @ApiProperty({
    description: 'Path to the saved JSON file (if saved)',
    example: 'output/output.json',
    required: false,
  })
  filePath?: string;
}
