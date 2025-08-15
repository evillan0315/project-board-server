import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TerminalCommandDto {
  @ApiProperty({
    description: 'Shell command to execute',
    example: 'ls -la',
  })
  @IsString()
  command: string;

  @ApiProperty({
    description: 'Working directory where the command should be run',
    example: './',
  })
  @IsString()
  cwd: string;
}
