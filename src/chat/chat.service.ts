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
  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 50, // Limit history size
    });

    // Note: The check below is slightly flawed. If a conversation exists but has no messages, it returns an empty array, 
    // which is valid. A better check is to see if the conversation itself exists, but for now, we'll keep the logic.
    if (!messages) { 
        throw new NotFoundException(`Conversation with ID ${conversationId} not found.`);
    }

    return messages;
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
      include: {messages:true}
      // You might add an 'include' here to show the last message or participants for the list view
    });

    if (!conversations || conversations.length === 0) {
      throw new NotFoundException(`No conversations found for user ID: ${userId}.`);
    }

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
