import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class MediaScanRequestDto {
  @ApiProperty({
    description: 'The absolute path to the directory to scan for media files.',
    example: '/home/user/music',
  })
  @IsString()
  @IsNotEmpty()
  directoryPath: string;
}
