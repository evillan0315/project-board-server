import {
  Injectable,
  NotFoundException,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJwtUserDto } from '../auth/dto/auth.dto';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import {
  ConversationHistoryItemDto,
  ConversationPartDto,
  ConversationSummaryDto, // Make sure this DTO is updated as shown above
} from './dto/conversation-history-item.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}

  private get userId(): string {
    if (!this.request.user || !this.request.user.id) {
      throw new InternalServerErrorException(
        'User ID not found in request context. Authentication might be missing or misconfigured.',
      );
    }
    return this.request.user.id;
  }
  /**
   * Retrieves a list of all conversations for the current user,
   * providing a summary for each (ID, first message preview, last message preview, and last update time).
   * Conversations are ordered by their most recent activity (lastUpdatedAt) in descending order.
   * @returns A promise that resolves to an array of ConversationSummaryDto.
   */
  async getConversations(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ConversationSummaryDto>> {
    const userId = this.userId;
    const { page = 1, limit = 100 } = paginationDto;

    const allRequests = await this.prisma.geminiRequest.findMany({
      where: {
        userId,
      },
      include: {
        geminiResponses: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const conversationsMap = new Map<
      string,
      { requests: any[]; lastUpdatedAt: Date }
    >();

    for (const request of allRequests) {
      const { conversationId } = request;
      if (conversationId) {
        const existing = conversationsMap.get(conversationId) || {
          requests: [],
          lastUpdatedAt: request.createdAt,
        };
        existing.requests.push(request);
        existing.lastUpdatedAt =
          request.createdAt > existing.lastUpdatedAt
            ? request.createdAt
            : existing.lastUpdatedAt;
        conversationsMap.set(conversationId, existing);
      }
    }

    const totalConversations = conversationsMap.size;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedSummaries: ConversationSummaryDto[] = Array.from(
      conversationsMap.entries(),
    )
      .sort(
        ([, a], [, b]) => b.lastUpdatedAt.getTime() - a.lastUpdatedAt.getTime(),
      )
      .slice(startIndex, endIndex)
      .map(([conversationId, data]) => {
        // --- CHANGES START HERE ---

        // Get the first request (already at index 0 due to 'asc' orderBy)
        const firstRequest = data.requests[0];
        const firstPromptRaw = firstRequest?.prompt ?? null;
        const firstPrompt =
          typeof firstPromptRaw === 'string'
            ? firstPromptRaw.slice(0, 100)
            : null;

        // Get the last request (most recent due to 'asc' orderBy)
        const lastRequest = data.requests[data.requests.length - 1];
        const lastPromptRaw = lastRequest?.prompt ?? null;
        const lastPrompt =
          typeof lastPromptRaw === 'string'
            ? lastPromptRaw.slice(0, 100)
            : null;

        return {
          conversationId,
          lastUpdatedAt: data.lastUpdatedAt,
          requestCount: data.requests.length,
          firstPrompt, // Include firstPrompt
          lastPrompt, // Include lastPrompt
        };
        // --- CHANGES END HERE ---
      });

    return {
      data: paginatedSummaries,
      total: totalConversations,
      page,
      limit,
      totalPages: Math.ceil(totalConversations / limit),
    };
  }
  /**
   * Retrieves a conversation's full request/response history with timestamps and inlineData format for files/images.
   * @param conversationId The ID of the conversation to fetch.
   */
  async getConversationHistory(
    conversationId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ConversationHistoryItemDto>> {
    const { page = 1, limit = 10 } = paginationDto;

    const requests = await this.prisma.geminiRequest.findMany({
      where: {
        conversationId,
        userId: this.userId,
      },
      include: {
        geminiResponses: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    /*if (!requests.length) {
      throw new NotFoundException(
        `No conversation found for ID: ${conversationId}`,
      );
    }*/

    const history: ConversationHistoryItemDto[] = [];

    for (const request of requests) {
      const parts: ConversationPartDto[] = [];

      if (request.prompt) {
        parts.push({ text: request.prompt });
      }

      if (request.fileData && request.fileMimeType) {
        parts.push({
          inlineData: {
            mime_type: request.fileMimeType,
            data: request.fileData,
          },
        });
      }

      if (request.imageData && request.imageUrl) {
        parts.push({
          inlineData: {
            mime_type: request.fileMimeType ?? 'image/png',
            data: request.imageData,
          },
        });
      }

      history.push({
        role: 'user',
        parts,
        createdAt: request.createdAt,
      });

      for (const response of request.geminiResponses) {
        if (response.responseText?.trim()) {
          history.push({
            role: 'model',
            parts: [{ text: response.responseText }],
            createdAt: response.createdAt,
          });
        }
      }
    }
    // Apply pagination to the fully sorted history
    const totalHistoryItems = history.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedHistory = history.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalHistoryItems / limit);
    return {
      data: paginatedHistory,
      total: totalHistoryItems,
      page,
      limit,
      totalPages,
    };
  }
}
