// src/api/conversation.ts
import { API_BASE_URL, ApiError, handleResponse, fetchWithAuth } from '@/api';
const API_URL = `${API_BASE_URL}`;
import {
  ConversationSummaryDto,
  PaginatedResponseDto,
  PaginationDto,
} from '@/types/conversation';

/**
 * Fetches a paginated list of conversation summaries from the backend.
 * @param paginationDto - Pagination, search, and filter parameters.
 * @returns A promise that resolves to a paginated response of ConversationSummaryDto.
 */
export async function getConversations(
  paginationDto: PaginationDto = {},
): Promise<PaginatedResponseDto<ConversationSummaryDto>> {
  const queryParams = new URLSearchParams();
  if (paginationDto.page)
    queryParams.append('page', paginationDto.page.toString());
  if (paginationDto.limit)
    queryParams.append('limit', paginationDto.limit.toString());
  if (paginationDto.search) queryParams.append('search', paginationDto.search);
  if (paginationDto.requestType)
    queryParams.append('requestType', paginationDto.requestType);

  const response = await fetch(
    `${API_URL}/conversations?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`, // Assuming token is stored in localStorage
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch conversations');
  }

  const data: PaginatedResponseDto<ConversationSummaryDto> =
    await response.json();

  // Convert date strings to Date objects for client-side usage if necessary
  // In this case, lastUpdatedAt is already a string in the DTO, so no conversion needed here
  // If it were a Date object, the conversion would happen here:
  // data.data = data.data.map(conv => ({
  //   ...conv,
  //   lastUpdatedAt: new Date(conv.lastUpdatedAt),
  // }));

  return data;
}
