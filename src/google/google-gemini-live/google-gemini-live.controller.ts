// src/google/google-gemini-live/google-gemini-live.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiExtraModels,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GoogleGeminiLiveService } from './google-gemini-live.service';
import {
  LiveConnectOptionsDto,
  LiveSessionResponseDto,
  LiveTurnResultDto,
  LiveTextInputDto, // New: for sending text
  LiveAudioInputDto, // New: for sending audio chunks
  ProcessTurnDto, // New: for triggering AI response
  LiveEndSessionDto, // New: for closing session
  // LiveSessionHandleDto is an internal service interface, not a direct API response type
} from './dto/gemini-live.dto'; // Ensure correct path for DTOs
import { JwtAuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Gemini Live')
@Controller('gemini/live')
@ApiExtraModels(
  LiveConnectOptionsDto,
  LiveSessionResponseDto,
  LiveTurnResultDto,
  LiveTextInputDto,
  LiveAudioInputDto,
  ProcessTurnDto,
  LiveEndSessionDto,
) // Register all DTOs used for Swagger generation
export class GoogleGeminiLiveController {
  constructor(private readonly geminiLiveService: GoogleGeminiLiveService) {}

  @Post('connect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connect to Gemini Live (REST simulation)' })
  @ApiBody({ type: LiveConnectOptionsDto, required: false })
  @ApiResponse({
    status: 200,
    type: LiveSessionResponseDto,
    description: 'A new session ID is created for subsequent interactions.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body or configuration.',
  })
  async connect(
    @Body() options: LiveConnectOptionsDto = {}, // Make options optional at controller level too
  ): Promise<LiveSessionResponseDto> {
    const { sessionId } = await this.geminiLiveService.connect(options);
    return { sessionId };
  }

  @Post('send-text')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buffer text input for Gemini Live session',
    description:
      'Sends text to the session, which is buffered for the current turn. ' +
      "Call `/process-turn` to trigger the AI's response.",
  })
  @ApiBody({ type: LiveTextInputDto })
  @ApiResponse({ status: 200, description: 'Text buffered successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid session ID or text input.' })
  async sendText(@Body() body: LiveTextInputDto) {
    await this.geminiLiveService.sendText(body.sessionId, body.text);
    return { success: true, message: 'Text buffered.' };
  }

  @Post('send-audio')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buffer audio chunk input for Gemini Live session',
    description:
      'Sends a base64-encoded audio chunk to the session, which is buffered for the current turn. ' +
      "Multiple chunks can be sent. Call `/process-turn` to trigger the AI's response.",
  })
  @ApiBody({ type: LiveAudioInputDto })
  @ApiResponse({
    status: 200,
    description: 'Audio chunk buffered successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid session ID, audio data, or MIME type.',
  })
  async sendAudio(@Body() body: LiveAudioInputDto) {
    // Decode the base64 audio chunk.
    const buffer = Buffer.from(body.audioChunk, 'base64');

    await this.geminiLiveService.sendAudioChunks(
      body.sessionId,
      [
        buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength,
        ),
      ], // Extract ArrayBuffer from Buffer
      body.mimeType,
    );

    return { success: true, message: 'Audio chunk buffered.' };
  }

  @Post('process-turn') // Renamed from 'wait-turn' for clarity
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process current turn and get Gemini Live response',
    description:
      'Triggers the AI to process all buffered text and audio inputs for the session ' +
      'and returns its response. This should be called after all inputs for a turn are sent.',
  })
  @ApiBody({ type: ProcessTurnDto })
  @ApiResponse({
    status: 200,
    type: LiveTurnResultDto,
    description:
      'Turn results from Gemini Live session, including AI response.',
  })
  @ApiBadRequestResponse({
    description: 'No input provided for the turn, or invalid session ID.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during Gemini API call.',
  })
  async processTurn(@Body() body: ProcessTurnDto): Promise<LiveTurnResultDto> {
    return this.geminiLiveService.waitTurn(body.sessionId);
  }

  @Post('close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close Gemini Live session' })
  @ApiBody({ type: LiveEndSessionDto })
  @ApiResponse({ status: 200, description: 'Session closed successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid session ID.' })
  async close(@Body() body: LiveEndSessionDto) {
    await this.geminiLiveService.close(body.sessionId);
    return { success: true, message: 'Session closed.' };
  }
}
