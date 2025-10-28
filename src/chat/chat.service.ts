import { Injectable, NotFoundException } from '@nestjs/common';
import { Conversation, Message, Sender } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new conversation record in the database.
   */
  async createConversation(data: CreateConversationDto): Promise<Conversation> {
    return this.prisma.conversation.create({
      data: {
        title: data.title,
        createdById: data.createdById,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Retrieves messages for a given conversation ID, ordered by creation time.
   */
  async getMessagesByConversationId(
    conversationId: string,
  ): Promise<Message[]> {
    // First, check if the conversation itself exists
    const conversationExists = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true }, // Only fetch ID for existence check
    });

    if (!conversationExists) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found.`,
      );
    }

    // If conversation exists, retrieve its messages
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 50, // Limit history size
    });

    return messages; // Returns an empty array if no messages, which is a valid response
  }

  /**
   * Retrieves a list of conversations associated with a given user ID.
   * In a real application, this would typically involve a join/intermediate table
   * (e.g., ConversationParticipants) to find all conversations a user is part of.
   * For simplicity here, we assume the user is the creator.
   */
  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      include: { messages: true },
      // You might add an 'include' here to show the last message or participants for the list view
    });

    // Return an empty array if no conversations are found, as this is a valid state.
    // An error should only be thrown if the userId itself is invalid or unauthorized.
    return conversations;
  }

  /**
   * Saves a new message to the database.
   */
  async saveMessage(
    conversationId: string,
    userId: string,
    content: string,
    sender: Sender,
  ): Promise<Message> {
    return this.prisma.message.create({
      data: {
        conversationId,
        createdById: userId,
        content,
        sender,
        // metadata is omitted for simplicity in this function
      },
    });
  }
}
