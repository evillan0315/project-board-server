import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class JsonToYamlDto {
  @ApiProperty({
    description: 'The JSON object to convert',
    example: {
      name: 'John Doe',
      age: 30,
      skills: ['NestJS', 'SolidJS'],
    },
  })
  @IsObject()
  json: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Optional filename (with .yaml extension)',
    example: 'custom-file.yaml',
  })
  @IsOptional()
  @IsString()
  filename?: string;
}
