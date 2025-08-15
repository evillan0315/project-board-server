// src/transpiler/dto/transpiler-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { TranspilerOptionsDto } from './transpiler-options.dto';

export class TranspilerRequestDto {
  @ApiProperty({ description: 'Source code to transpile.' })
  code: string;

  @ApiProperty({
    type: TranspilerOptionsDto,
    required: false,
    description: 'Transpilation options.',
  })
  options?: TranspilerOptionsDto;
}
