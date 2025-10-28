import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { Conversation } from '@prisma/client';
import { CreateConversationDto, GetConversationsDto } from './dto/chat.dto';

@ApiTags('Chat Conversations')
@Controller('api/chat/conversations') // Changed path to 'chat/conversations' assuming global 'api' prefix
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * REST endpoint to create a new Conversation record.
   * This is typically the first step before initiating chat or video.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new chat conversation' })
  @ApiBody({ type: CreateConversationDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The conversation has been successfully created.',
    // In a real application, you might define a specific response model/interface here
    // For now, we'll use a generic object to represent the Prisma Conversation model.
  })
  async create(
    @Body() createConversationDto: CreateConversationDto,
  ): Promise<Conversation> {
    return this.chatService.createConversation(createConversationDto);
  }

  /**
   * REST endpoint to retrieve a list of conversations associated with a user.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all conversations for a specific user' })
  @ApiQuery({
    name: 'userId',
    type: 'string',
    description: 'The UUID of the user to fetch conversations for.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved the list of conversations.',
    isArray: true,
  })
  async getConversations(
    @Query() query: GetConversationsDto,
  ): Promise<Conversation[]> {
    // In a secure application, 'userId' would be extracted from an AuthGuard (req.user.id)
    // Here, we use the userId from the query parameter to fetch the conversations.
    return this.chatService.getConversationsByUserId(query.userId);
  }
}
