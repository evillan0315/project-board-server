// src/types/conversation.ts
import { RequestType } from './llm';

/**
 * DTO for creating a new Conversation via REST.
 * Matches backend's `CreateConversationDto`.
 */
export interface CreateConversationDto {
  title: string;
  createdById: string;
}

/**
 * DTO for getting a list of conversations for a user via REST.
 * Matches backend's `GetConversationsDto`.
 */
export interface GetConversationsDto {
  userId: string;
}

/**
 * Represents a Conversation entity from the backend.
 * Simplified for frontend consumption.
 */
export interface Conversation {
  id: string;
  title: string;
  createdById: string;
  status: 'ACTIVE' | 'ARCHIVED'; // Assuming these are valid statuses
  createdAt: string; // ISO Date string
  updatedAt: string | null; // ISO Date string
}

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