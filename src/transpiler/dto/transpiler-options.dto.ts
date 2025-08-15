// src/transpiler/dto/transpiler-options.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TranspilerOptionsDto {
  @ApiPropertyOptional({
    enum: ['tsx', 'ts', 'jsx', 'js'],
    description: 'The loader type for the code.',
  })
  loader?: 'tsx' | 'ts' | 'jsx' | 'js';

  @ApiPropertyOptional({
    enum: ['es2017', 'es2018', 'esnext'],
    description: 'Target JavaScript version.',
  })
  target?: 'es2017' | 'es2018' | 'esnext';

  @ApiPropertyOptional({ description: 'Indicates if the code is SolidJS.' })
  solid?: boolean;

  @ApiPropertyOptional({ description: 'Indicates if the code is React.' })
  react?: boolean;
}
