import { ApiProperty } from '@nestjs/swagger';

export class StartRecordingResponseDto {
  @ApiProperty({ description: 'Path to the recording file' })
  path: string;

  @ApiProperty({ description: 'Recording ID' })
  id: string;
}
