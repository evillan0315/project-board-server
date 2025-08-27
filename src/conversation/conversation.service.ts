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
  ConversationSummaryDto,
} from './dto/conversation-history-item.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { RequestType } from '@prisma/client'; // Import RequestType enum
import { GeminiRequest as PrismaGeminiRequest } from '@prisma/client'; // Import Prisma's GeminiRequest type

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
   * Supports filtering by search query on first prompt and by first request type.
   * @returns A promise that resolves to an array of ConversationSummaryDto.
   */
  async getConversations(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ConversationSummaryDto>> {
    const userId = this.userId;
    const { page = 1, limit = 100, search, requestType } = paginationDto; // Extract search and requestType

    // Fetch all requests for the user. We will filter in-memory for simplicity
    // given the complex aggregation required for conversation summaries.
    const allRequests = await this.prisma.geminiRequest.findMany({
      where: {
        userId,
        conversationId: { not: null }, // Only consider requests that are part of a conversation
      },
      include: {
        geminiResponses: true,
      },
      orderBy: {
        createdAt: 'asc', // Important for identifying first/last requests
      },
    });

    // Group requests by conversationId to form conversation summaries
    const conversationsMap = new Map<
      string, // This is the key type, which is 'string'
      { requests: PrismaGeminiRequest[]; lastUpdatedAt: Date }
    >();

    for (const request of allRequests) {
      const { conversationId } = request;
      // Because `where: { conversationId: { not: null } }` is used in the query,
      // `conversationId` is guaranteed to be a string here.
      // We use a non-null assertion `!` to tell TypeScript this.
      const currentConversationId: string = conversationId!;

      // Use currentConversationId, which TypeScript now knows is a string
      const existing = conversationsMap.get(currentConversationId) || {
        requests: [],
        lastUpdatedAt: request.createdAt,
      };
      existing.requests.push(request);
      existing.lastUpdatedAt =
        request.createdAt > existing.lastUpdatedAt
          ? request.createdAt
          : existing.lastUpdatedAt;
      conversationsMap.set(currentConversationId, existing);
    }

    // Convert map to array, sort by lastUpdatedAt, and generate summaries
    let allConversationSummaries: ConversationSummaryDto[] = Array.from(
      conversationsMap.entries(),
    )
      .sort(
        ([, a], [, b]) => b.lastUpdatedAt.getTime() - a.lastUpdatedAt.getTime(),
      )
      .map(([conversationId, data]) => {
        const firstRequest = data.requests[0];
        const firstPromptRaw = firstRequest?.prompt ?? null;
        const firstPrompt =
          typeof firstPromptRaw === 'string'
            ? firstPromptRaw.slice(0, 100)
            : null;

        const lastRequest = data.requests[data.requests.length - 1];
        const lastPromptRaw = lastRequest?.prompt ?? null;
        const lastPrompt =
          typeof lastPromptRaw === 'string'
            ? lastPromptRaw.slice(0, 100)
            : null;

        const firstRequestType = firstRequest?.requestType ?? null;

        return {
          conversationId,
          lastUpdatedAt: data.lastUpdatedAt,
          requestCount: data.requests.length,
          firstPrompt,
          lastPrompt,
          firstRequestType,
        };
      });

    // Apply search and requestType filters in-memory
    if (search) {
      const lowerCaseSearch = search.toLowerCase();
      allConversationSummaries = allConversationSummaries.filter((summary) =>
        (summary.firstPrompt || '')
          .toLowerCase()
          .includes(lowerCaseSearch),
      );
    }

    if (requestType) {
      allConversationSummaries = allConversationSummaries.filter(
        (summary) => summary.firstRequestType === requestType,
      );
    }

    // Now, apply pagination to the filtered and sorted list
    const totalFilteredConversations = allConversationSummaries.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedSummaries: ConversationSummaryDto[] =
      allConversationSummaries.slice(startIndex, endIndex);

    return {
      data: paginatedSummaries,
      total: totalFilteredConversations,
      page,
      limit,
      totalPages: Math.ceil(totalFilteredConversations / limit),
    };
  }
  /**
   * Retrieves a conversation's full request/response history with timestamps and inlineData format for files/images.
   * @param conversationId The ID of the conversation to fetch.
   * @param paginationDto Pagination parameters.
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
            mime_type: request.fileMimeType ?? 'image/png', // Fallback for mime type
            data: request.imageData,
          },
        });
      }

      history.push({
        role: 'user',
        parts,
        createdAt: request.createdAt,
        requestType: request.requestType, // Added requestType for user turn
      });

      for (const response of request.geminiResponses) {
        if (response.responseText?.trim()) {
          history.push({
            role: 'model',
            parts: [{ text: response.responseText }],
            createdAt: response.createdAt,
            tokenCount: response?.tokenCount ?? undefined,
            id: response?.id,
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

