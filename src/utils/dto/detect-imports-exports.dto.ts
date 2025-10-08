import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class DetectImportsExportsDto {
  @ApiProperty({
    description: 'The code string to analyze for imports and exports.',
    example: "import { useState } from 'react';\nexport const myVar = 10;",
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'The programming language of the code (e.g., "typescript", "javascript", "tsx", "jsx").',
    example: 'typescript',
  })
  @IsString()
  @IsNotEmpty()
  language: string;
}
