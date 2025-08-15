import { ApiProperty } from '@nestjs/swagger';

export class FormatCodeDto {
  @ApiProperty({ example: 'function test() { return 42; }' })
  code: string;

  @ApiProperty({ example: 'javascript' })
  language: string;
}
