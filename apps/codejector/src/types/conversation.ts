// src/types/conversation.ts
import { RequestType } from './llm';

/**
 * Defines parameters for pagination.
 */
export interface PaginationDto {
  page?: number;
  limit?: number;
  search?: string;
  requestType?: RequestType;
}

/**
 * Represents a summary of a single conversation.
 */
export interface ConversationSummaryDto {
  conversationId: string;
  lastUpdatedAt: string | Date; // Use string for ISO format from API, Date for client-side processing
  requestCount: number;
  firstPrompt: string | null;
  lastPrompt: string | null;
  firstRequestType?: RequestType | null;
}

/**
 * Generic structure for paginated API responses.
 */
export interface PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
