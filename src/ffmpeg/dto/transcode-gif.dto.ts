 // src/ffmpeg/dto/transcode-gif.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class TranscodeToGifDto {
  @ApiProperty({
    description: 'The filename (e.g., "my_recording.mp4") of an existing video recording in the "downloads/recordings" directory to convert to GIF.',
    example: 'screen-record-1701234567890.mp4',
  })
  @IsString()
  @IsNotEmpty()
  inputFilename: string;

  @ApiProperty({
    description: 'Frames per second for the GIF. Lower for smaller files, but can make animation less smooth. Default: 15.',
    required: false,
    default: 15,
    minimum: 1,
    maximum: 60,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(60)
  fps?: number;

  @ApiProperty({
    description: 'Width of the GIF in pixels. The height will be automatically calculated to maintain aspect ratio. Lower for smaller files. Default: 480.',
    required: false,
    default: 480,
    minimum: 100,
    maximum: 1920,
  })
  @IsNumber()
  @IsOptional()
  @Min(100)
  @Max(1920)
  width?: number;

  @ApiProperty({
    description: 'How many times the GIF should loop. 0 for infinite loop (default), -1 for no loop, or a positive integer for N loops.',
    required: false,
    default: 0,
    minimum: -1,
  })
  @IsNumber()
  @IsOptional()
  @Min(-1)
  loop?: number;
}

export class TranscodeGifResponseDto {
  @ApiProperty({ description: 'A confirmation message about the GIF transcoding operation.' })
  message: string;

  @ApiProperty({ description: 'The filename of the newly generated GIF file.' })
  outputFilename: string;

  @ApiProperty({ description: 'The full path to the newly generated GIF file on the server.' })
  fullPath: string;
}
