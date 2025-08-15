import { ApiProperty } from '@nestjs/swagger';

export class JsonToYamlResponseDto {
  @ApiProperty({
    description: 'The converted YAML output as a string',
    example: 'name: John Doe\nage: 30\nskills:\n  - NestJS\n  - SolidJS\n',
  })
  yaml: string;

  @ApiProperty({
    description: 'Path to the saved YAML file (if saved)',
    example: 'output/output.yaml',
    required: false,
  })
  filePath?: string;
}
