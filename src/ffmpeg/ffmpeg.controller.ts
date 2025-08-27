// src/ffmpeg/ffmpeg.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { join } from 'path';
import { stat, mkdir } from 'fs/promises';

import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator'; // Corrected import
import { CreateJwtUserDto } from '../auth/dto/auth.dto'; // Corrected import and type reference
import { FfmpegService } from './ffmpeg.service';

import { TranscodeToGifDto, TranscodeGifResponseDto } from './dto/transcode-gif.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('FFmpeg Transcoding')
@Controller('api/ffmpeg')
export class FfmpegController {
  constructor(private readonly ffmpegService: FfmpegService) {}

  @Post('transcode-gif')
  @Roles(UserRole.ADMIN, UserRole.USER) // Or adjust roles as needed
  @ApiOperation({ summary: 'Transcode an existing recorded video to an optimized GIF.' })
  @ApiCreatedResponse({
    description: 'GIF transcoding initiated successfully. The generated GIF filename is returned.',
    type: TranscodeGifResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input filename or parameters.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'GIF transcoding failed due to server error.' })
  async transcodeToGif(
    @Body() dto: TranscodeToGifDto,
    @CurrentUser('id') userId: string, // <-- Using the @CurrentUser decorator
  ): Promise<TranscodeGifResponseDto> {
    if (!userId) {
      // This check is important as it indicates a misconfiguration in authentication or JWT payload.
      throw new InternalServerErrorException('User ID not found in token. Authentication misconfiguration.');
    }

    // Construct the user-specific recordings directory
    const userRecordingsBaseDir = join(process.cwd(), 'downloads', 'recordings');
    const recordingsDir = join(userRecordingsBaseDir, userId); // Add userId to the path

    // 0. Ensure the user's recording directory exists
    try {
      await mkdir(recordingsDir, { recursive: true }); // Create directory if it doesn't exist
    } catch (dirError) {
      console.error(`Failed to create directory ${recordingsDir} for user ${userId}:`, dirError);
      throw new InternalServerErrorException(`Could not ensure directory for user recordings: ${dirError.message}`);
    }

    const inputPath = join(recordingsDir, dto.inputFilename);

    // 1. Validate input file existence within the user's directory
    try {
      await stat(inputPath);
    } catch (error) {
      // Check if the error is due to file not found and provide a more specific message
      if (error.code === 'ENOENT') {
        throw new BadRequestException(`Input video file "${dto.inputFilename}" not found for user ${userId}.`);
      }
      // Re-throw other types of errors (e.g., permissions)
      console.error(`Error accessing input file ${inputPath} for user ${userId}:`, error);
      throw new InternalServerErrorException(`Error checking input file: ${error.message}`);
    }

    // 2. Determine output path for the GIF
    const outputFilenameBase = dto.inputFilename.replace(/\.[^/.]+$/, ''); // Remove original extension
    const outputGifFilename = `${outputFilenameBase}_${Date.now()}.gif`; // Append timestamp to avoid overwrites
    const outputPath = join(recordingsDir, outputGifFilename);

    // 3. Define a simple progress emitter (you could integrate WebSockets for real-time updates)
    const emitProgress = (progress: { time: string }) => {
      // console.log(`GIF Transcoding Progress for user ${userId}, file ${dto.inputFilename}: ${progress.time}`);
      // For a production system, you might emit this via a WebSocket to a specific client.
    };

    try {
      // 4. Call the FfmpegService to transcode
      await this.ffmpegService.transcodeToGif(
        inputPath,
        outputPath,
        emitProgress,
        {
          fps: dto.fps,
          width: dto.width,
          loop: dto.loop,
        },
      );
      return {
        message: 'GIF transcoding completed successfully.',
        outputFilename: outputGifFilename,
        fullPath: outputPath,
      };
    } catch (error) {
      console.error(`Error during GIF transcoding for user ${userId}, file ${dto.inputFilename}:`, error);
      throw new InternalServerErrorException(`Failed to transcode video to GIF: ${error.message}`);
    }
  }
}
