import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { GoogleGeminiImageService } from './google-gemini-image.service';
import {
  ImageCaptionDto,
  CaptionFromUrlDto,
  CaptionFromFileDto,
} from './dto/image-caption.dto';

@ApiTags('Google Gemini')
@Controller('api/google-gemini-image')
export class GoogleGeminiImageController {
  constructor(private readonly geminiService: GoogleGeminiImageService) {}

  @Post('caption')
  @ApiOperation({ summary: 'Generate a caption for an image URL using Gemini' })
  @ApiBody({ type: ImageCaptionDto })
  async captionImage(@Body() body: ImageCaptionDto): Promise<string> {
    return this.geminiService.captionImageFromUrl(body.imageUrl, body.prompt);
  }
  @Post('caption-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a caption for an image URL' })
  @ApiBody({ type: CaptionFromUrlDto })
  @ApiResponse({ status: 200, description: 'Caption generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid image URL or request' })
  @ApiResponse({
    status: 502,
    description: 'Failed to process image with Gemini',
  })
  async captionFromUrl(@Body() body: CaptionFromUrlDto): Promise<string> {
    return this.geminiService.captionImageFromUrl(body.imageUrl, body.prompt);
  }

  @Post('caption-file')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a caption for a local image file' })
  @ApiBody({ type: CaptionFromFileDto })
  @ApiResponse({ status: 200, description: 'Caption generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file path or request' })
  @ApiResponse({
    status: 502,
    description: 'Failed to process image with Gemini',
  })
  async captionFromFile(@Body() body: CaptionFromFileDto): Promise<string> {
    return this.geminiService.captionImageFromFile(body.filePath, body.prompt);
  }
}
