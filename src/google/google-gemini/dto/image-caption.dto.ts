import { ApiProperty } from '@nestjs/swagger';

export class ImageCaptionDto {
  @ApiProperty({ example: 'https://example.com/image.jpg' })
  imageUrl: string;

  @ApiProperty({ example: 'Caption this image.', required: false })
  prompt?: string;
}

export class CaptionFromUrlDto {
  @ApiProperty({ example: 'https://example.com/image.jpg' })
  imageUrl: string;

  @ApiProperty({ example: 'What is shown in this image?', required: false })
  prompt?: string;
}

export class CaptionFromFileDto {
  @ApiProperty({ example: './assets/sample.jpg' })
  filePath: string;

  @ApiProperty({
    example: 'Provide a short caption for this file.',
    required: false,
  })
  prompt?: string;
}
