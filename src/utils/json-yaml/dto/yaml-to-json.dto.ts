import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class YamlToJsonDto {
  @ApiProperty({
    description: 'The YAML string to convert',
    example: 'name: John Doe\nage: 30\nskills:\n  - NestJS\n  - SolidJS\n',
  })
  @IsString()
  yaml: string;

  @ApiPropertyOptional({
    description: 'Optional filename (with .json extension)',
    example: 'custom-file.json',
  })
  @IsOptional()
  @IsString()
  filename?: string;
}
