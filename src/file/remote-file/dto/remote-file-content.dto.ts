import { ApiProperty } from '@nestjs/swagger';

export class RemoteFileContentDto {
  @ApiProperty({ description: 'Content to write to the file' })
  content: string;
}
