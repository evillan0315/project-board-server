// conversation-history-item.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsIn,
  IsMimeType,
  IsOptional,
  IsString,
  ValidateNested,
  IsNumber,
  IsEnum,
  IsUUID, // Added for UUID validation
} from 'class-validator';

// IMPORTANT: Make sure to import your RequestType enum, e.g.:
import { RequestType } from '@prisma/client'; // Adjust path if necessary
// Or, if you want to define it locally for DTO purposes (less ideal if from Prisma)
/*
export enum RequestType {
  TEXT_ONLY = 'TEXT_ONLY',
  TEXT_WITH_IMAGE = 'TEXT_WITH_IMAGE',
  TEXT_WITH_FILE = 'TEXT_WITH_FILE',
  LLM_GENERATION = 'LLM_GENERATION',
  LIVE_API = 'LIVE_API',
  RESUME_GENERATION = 'RESUME_GENERATION',
  RESUME_OPTIMIZATION = 'RESUME_OPTIMIZATION',
  RESUME_ENHANCEMENT = 'RESUME_ENHANCEMENT',
}
*/

export class InlineDataDto {
  @ApiProperty({
    description:
      'The MIME type of the inline data (e.g., image/png, application/pdf)',
    example: 'image/png',
  })
  @IsMimeType()
  mime_type: string;

  @ApiProperty({
    description: 'Base64-encoded string of the file or image data',
    example: 'iVBORw0KGgoAAAANSUhEUgAAAAUA...',
  })
  @IsString()
  data: string;
}

export class ConversationPartDto {
  @ApiPropertyOptional({
    description: 'Text content of the message part',
    example: 'Hello, how can I help you?',
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description: 'Inline file or image data',
    type: () => InlineDataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InlineDataDto)
  inlineData?: InlineDataDto;
}

export class ConversationHistoryItemDto {
  @ApiProperty({
    description: 'The role of the message sender',
    enum: ['user', 'model'],
    example: 'user',
  })
  @IsIn(['user', 'model'])
  role: 'user' | 'model';

  @ApiProperty({
    description:
      'Array of message parts, each containing either text or inline data',
    type: [ConversationPartDto],
    example: [
      { text: 'Can you generate a summary of the latest AI trends?' },
      {
        inlineData: {
          mime_type: 'image/png',
          data: 'iVBORw0KGgoAAAANSUhEUgAAAAUA...', // Example Base64
        },
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversationPartDto)
  parts: ConversationPartDto[];

  @ApiProperty({
    description: 'Timestamp indicating when the message was created',
    example: new Date().toISOString(),
    type: String, // Ensure Swagger shows it as string for ISO format
    format: 'date-time',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdAt?: Date;

  @ApiPropertyOptional({
    description: 'The type of request made by the user, if applicable.',
    enum: RequestType,
    example: RequestType.TEXT_WITH_IMAGE, // Example from your enum
  })
  @IsOptional()
  @IsEnum(RequestType)
  requestType?: RequestType;

  @ApiPropertyOptional({
    description: 'The number of tokens used for this message.',
    type: Number,
    example: 150,
  })
  @IsOptional()
  @IsNumber()
  tokenCount?: number;

  @ApiPropertyOptional({
    description: 'Unique identifier for the history item.',
    type: String,
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsOptional()
  @IsUUID() // Validate as UUID
  id?: string;
}

export class ConversationSummaryDto {
  @ApiProperty({
    description: 'Unique identifier for the conversation',
    example: 'clsyh7w100000a0t6r4d8e2z3',
  })
  @IsString()
  conversationId: string;

  @ApiProperty({
    description: 'Timestamp of the last activity in the conversation',
    example: new Date().toISOString(),
    type: String,
    format: 'date-time',
  })
  @IsDate()
  @Type(() => Date)
  lastUpdatedAt: Date;

  @ApiProperty({
    description: 'Total number of requests (user turns) in the conversation',
    example: 5,
  })
  @IsNumber()
  requestCount: number;

  @ApiProperty({
    description: 'Preview of the first prompt (first 100 characters)',
    example: 'Analyze the provided image and generate a descriptive caption.',
  })
  @IsString()
  @IsOptional() // Nullable in service logic
  firstPrompt: string | null;

  @ApiProperty({
    description: 'Preview of the last prompt (first 100 characters)',
    example: 'Could you also suggest related topics for further research?',
  })
  @IsString()
  @IsOptional() // Nullable in service logic
  lastPrompt: string | null;

  @ApiPropertyOptional({
    description: 'The type of the first request made in the conversation.',
    enum: RequestType,
    example: RequestType.TEXT_WITH_IMAGE, // Example from your enum
  })
  @IsOptional()
  @IsEnum(RequestType)
  firstRequestType?: RequestType;
}

