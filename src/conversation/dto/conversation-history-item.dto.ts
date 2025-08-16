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
} from 'class-validator';

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
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversationPartDto)
  parts: ConversationPartDto[];

  @ApiProperty({
    description: 'Timestamp indicating when the message was created',
    example: new Date().toISOString(),
    type: String,
    format: 'date-time',
  })
  @IsDate()
  @Type(() => Date)
  createdAt?: Date;
}

export class ConversationSummaryDto {
  conversationId: string;
  lastUpdatedAt: Date;
  requestCount: number;
  firstPrompt: string | null; // Keep this
  lastPrompt: string | null; // Add this
}
