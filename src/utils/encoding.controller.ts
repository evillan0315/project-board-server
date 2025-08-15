import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EncodingService } from './encoding.service';

class CodePayloadDto {
  code: string;
}

class EncodedPayloadDto {
  encoded: string;
}

@ApiTags('Encoding')
@Controller('api/encoding')
export class EncodingController {
  constructor(private readonly encodingService: EncodingService) {}

  @Post('base64/encode')
  @ApiOperation({ summary: 'Encode code to Base64' })
  @ApiBody({
    description: 'Code string to encode',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'console.log("Hello")' },
      },
      required: ['code'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Base64 encoded string',
    schema: {
      type: 'object',
      properties: {
        encoded: { type: 'string', example: 'Y29uc29sZS5sb2goIkhlbGxvIik=' },
      },
    },
  })
  encodeToBase64(@Body() body: CodePayloadDto): { encoded: string } {
    return { encoded: this.encodingService.encodeToBase64(body.code) };
  }

  @Post('base64/decode')
  @ApiOperation({ summary: 'Decode code from Base64' })
  @ApiBody({
    description: 'Base64 encoded string to decode',
    schema: {
      type: 'object',
      properties: {
        encoded: { type: 'string', example: 'Y29uc29sZS5sb2goIkhlbGxvIik=' },
      },
      required: ['encoded'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Decoded code string',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'console.log("Hello")' },
      },
    },
  })
  decodeFromBase64(@Body() body: EncodedPayloadDto): { code: string } {
    return { code: this.encodingService.decodeFromBase64(body.encoded) };
  }

  @Post('url/encode')
  @ApiOperation({ summary: 'Encode code to URL-encoded format' })
  @ApiBody({
    description: 'Code string to URL encode',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'console.log("Hello")' },
      },
      required: ['code'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'URL-encoded string',
    schema: {
      type: 'object',
      properties: {
        encoded: { type: 'string', example: 'console.log%28%22Hello%22%29' },
      },
    },
  })
  encodeToURIComponent(@Body() body: CodePayloadDto): { encoded: string } {
    return { encoded: this.encodingService.encodeToURIComponent(body.code) };
  }

  @Post('url/decode')
  @ApiOperation({ summary: 'Decode code from URL-encoded format' })
  @ApiBody({
    description: 'URL-encoded string to decode',
    schema: {
      type: 'object',
      properties: {
        encoded: { type: 'string', example: 'console.log%28%22Hello%22%29' },
      },
      required: ['encoded'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Decoded code string',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'console.log("Hello")' },
      },
    },
  })
  decodeFromURIComponent(@Body() body: EncodedPayloadDto): { code: string } {
    return { code: this.encodingService.decodeFromURIComponent(body.encoded) };
  }
}
