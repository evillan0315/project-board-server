import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator'; // Assuming you have class-validator setup

export class ExecDto {
  @ApiProperty({
    description: 'Shell command to execute',
    example: 'ls -la',
  })
  @IsOptional()
  @IsString()
  command?: string; // The command string, if a command is being executed

  @ApiProperty({
    description: 'Working directory where the command should be run',
    example: './',
  })
  @IsOptional()
  @IsString()
  newCwd?: string; // The new CWD path, if the frontend wants to change directory
}

