import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateCommandHistoryDto {
  @ApiProperty({ description: 'The command executed' })
  @IsString()
  command: string;

  @ApiProperty({
    description: 'Current working directory when the command was executed',
    required: false,
  })
  @IsOptional()
  @IsString()
  workingDirectory?: string;

  @ApiProperty({ description: 'Status of the command execution', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Exit code of the command', required: false })
  @IsOptional()
  @IsInt()
  exitCode?: number;

  @ApiProperty({ description: 'Output of the command', required: false })
  @IsOptional()
  @IsString()
  output?: string;

  @ApiProperty({ description: 'Error output of the command', required: false })
  @IsOptional()
  @IsString()
  errorOutput?: string;

  @ApiProperty({
    description: 'Duration of the command execution in milliseconds',
    required: false,
  })
  @IsOptional()
  @IsInt()
  durationMs?: number;

  @ApiProperty({ description: 'Type of shell used (e.g., bash, powershell)', required: false })
  @IsOptional()
  @IsString()
  shellType?: string;
}
