import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartRecordingDto {
  @ApiPropertyOptional({ description: 'Recording name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Recording type (screenRecord, screenShot)' })
  @IsString()
  type: string;
}
