import { ApiProperty } from '@nestjs/swagger';

export class VideoGenerationResultDto {
  @ApiProperty({
    description: 'The publicly accessible URI (URL) of the generated video.',
    example: 'https://storage.googleapis.com/veo-generated-videos/abc-xyz-video.mp4',
  })
  videoUri: string;

  // Potentially add other metadata like duration, resolution, or a job ID
  // if the API returns them and they are useful for the client.
}

