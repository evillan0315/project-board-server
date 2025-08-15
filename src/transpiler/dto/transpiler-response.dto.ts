// src/transpiler/dto/transpiler-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class TranspilerResponseDto {
  @ApiProperty({ description: 'Transpiled JavaScript code.' })
  code: string;
}
