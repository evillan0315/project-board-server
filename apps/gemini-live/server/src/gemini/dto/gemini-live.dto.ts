import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

// --- Interfaces for server-side content & messages (from AI to client) ---

export class LiveServerContentDto {
  @IsOptional()
  @IsBoolean()
  turnComplete?: boolean;
}

export class LiveMessageDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LiveServerContentDto)
  serverContent?: LiveServerContentDto;
}

export class LiveTurnResultDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LiveMessageDto)
  messages: LiveMessageDto[];

  @IsArray()
  @IsString({ each: true })
  texts: string[];

  @IsArray()
  datas: any[]; // Will be empty for generateContent REST API as it doesn't return raw data directly.
}

// --- Configuration & Options DTOs ---

export class LiveConfigDto {
  @IsOptional()
  @IsString()
  model?: string; // e.g., 'gemini-1.5-flash-latest'
}

export class LiveConnectOptionsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => LiveConfigDto)
  config?: LiveConfigDto;

  @IsOptional()
  @IsString()
  initialText?: string;
}

// --- DTOs for Client-to-Server Events ---

export class StartLiveSessionDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => LiveConnectOptionsDto)
  options?: LiveConnectOptionsDto;
}

export class LiveSessionResponseDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class LiveTextInputDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  text: string;
}

export class LiveAudioInputDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  audioChunk: string; // Base64 encoded audio chunk

  @IsString()
  @IsNotEmpty()
  mimeType: string;
}

export class ProcessTurnDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class LiveEndSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
