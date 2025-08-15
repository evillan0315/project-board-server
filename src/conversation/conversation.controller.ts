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
} from '@nestjs/swagger';
import { ConversationService } from './conversation.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { ConversationHistoryItemDto } from './dto/conversation-history-item.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Conversations')
@Controller('api/conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get conversations' })
  async getConversations(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<any>> {
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
