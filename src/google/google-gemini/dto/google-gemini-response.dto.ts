import { ApiProperty } from '@nestjs/swagger';

export class GoogleGeminiResponseDto {
  @ApiProperty({
    description:
      'The generated or processed code, documentation, or analysis result.',
    example: 'function optimizedExample() { /* improved code */ }',
  })
  result: string;
}
