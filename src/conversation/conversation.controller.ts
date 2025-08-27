import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery, // Import ApiQuery
} from '@nestjs/swagger';
import { ConversationService } from './conversation.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { ConversationHistoryItemDto, ConversationSummaryDto } from './dto/conversation-history-item.dto'; // Import ConversationSummaryDto for ApiResponse
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { RequestType } from '@prisma/client'; // Import RequestType for ApiQuery enum

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Conversations')
@Controller('api/conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get conversations with optional search and filter' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved paginated list of conversation summaries.',
    type: PaginatedResponseDto<ConversationSummaryDto>, // Use generic DTO for response type
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search query to filter conversations by their first prompt.',
  })
  @ApiQuery({
    name: 'requestType',
    required: false,
    enum: RequestType, // Use the imported RequestType enum
    description: 'Filter conversations by the type of their first request.',
  })
  async getConversations(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ConversationSummaryDto>> { // Changed to ConversationSummaryDto
    return this.conversationService.getConversations(paginationDto);
  }

  @Get(':conversationId/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get conversation history by conversation ID' })
  @ApiParam({
    name: 'conversationId',
    description: 'UUID of the conversation',
    type: String,
    example: '5c0f6e6c-d3d3-4b23-8c1c-d72c2e2851aa',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns an array of conversation messages with roles and content.',
    type: [ConversationHistoryItemDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
  })
  async getConversationHistory(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ConversationHistoryItemDto>> {
    return this.conversationService.getConversationHistory(
      conversationId,
      paginationDto,
    );
  }
}

