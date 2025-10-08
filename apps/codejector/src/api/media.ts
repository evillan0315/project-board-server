import { API_BASE_URL, ApiError, handleResponse, fetchWithAuth } from '@/api';
import { getToken } from '@/stores/authStore';
import {
  CreateMediaDto,
  MediaFileResponseDto,
  PaginationMediaQueryDto,
  PaginationMediaResultDto,
  MediaScanRequestDto,
  MediaScanResponseDto,
  TranscriptionResult,
  SyncTranscriptionResponse,
} from '@/types';

/**
 * Constructs a URL for streaming a file from the backend.
 * @param filePath The path to the file on the backend server.
 * @returns A URL string that can be used as an audio/video source.
 */
export const getFileStreamUrl = (filePath: string): string => {
  const token = getToken();
  // Construct the URL to the backend's stream endpoint
  const url = new URL(`${API_BASE_URL}/file/stream`, window.location.origin);
  url.searchParams.append('filePath', filePath);
  if (token) {
    url.searchParams.append('token', token); // Append token for authentication
  }
  return url.toString();
};

/**
 * Sends a request to the backend to extract audio/video from a URL.
 * @param dto The data transfer object containing the URL and format.
 * @returns A promise that resolves to a MediaFileResponseDto.
 */
export const extractMedia = async (
  dto: CreateMediaDto,
): Promise<MediaFileResponseDto> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/media/extract`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return handleResponse<MediaFileResponseDto>(response);
  } catch (error) {
    console.error('Error extracting media:', error);
    throw error;
  }
};

/**
 * Fetches a paginated list of media files.
 * @param query The pagination and filter query parameters.
 * @returns A promise that resolves to a PaginationMediaResultDto.
 */
export const fetchMediaFiles = async (
  query: PaginationMediaQueryDto = {},
): Promise<PaginationMediaResultDto> => {
  try {
    const queryString = new URLSearchParams(
      query as Record<string, string>,
    ).toString();
    const response = await fetchWithAuth(
      `${API_BASE_URL}/media?${queryString}`,
      { method: 'GET' },
    );

    const media = await handleResponse<PaginationMediaResultDto>(response);
    console.log(media, 'fetchMediaFiles');
    if (media && media.items.length > 0) {
      return media;
    }
  } catch (error) {
    console.error('Error fetching media files:', error);
    throw error;
  }
};

/**
 * Fetches a single media file by its ID.
 * @param id The ID of the media file.
 * @returns A promise that resolves to a MediaFileResponseDto.
 */
export const fetchMediaFileById = async (
  id: string,
): Promise<MediaFileResponseDto> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/media/${id}`);
    return handleResponse<MediaFileResponseDto>(response);
  } catch (error) {
    console.error(`Error fetching media file with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a media file by its ID.
 * @param id The ID of the media file to delete.
 * @returns A promise that resolves to a success message.
 */
export const deleteMediaFile = async (
  id: string,
): Promise<{ message: string }> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/media/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(response);
  } catch (error) {
    console.error(`Error deleting media file with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Sends a request to the backend to scan a directory for media files.
 * @param dto The data transfer object containing the directory path.
 * @returns A promise that resolves to a MediaScanResponseDto.
 */
export const scanMediaDirectory = async (
  dto: MediaScanRequestDto,
): Promise<MediaScanResponseDto> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/media/scan-directory`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      },
    );
    return handleResponse<MediaScanResponseDto>(response);
  } catch (error) {
    console.error('Error scanning media directory:', error);
    throw error;
  }
};

// =========================================================================
// Transcription API Functions
// =========================================================================

/**
 * Transcribes an audio file using speech-to-text
 * @param fileId The ID of the audio file to transcribe
 * @returns A promise that resolves to a TranscriptionResult
 */
export const transcribeAudio = async (
  fileId: string,
): Promise<TranscriptionResult> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/media/${fileId}/transcribe`,
      {
        method: 'POST',
      },
    );
    return handleResponse<TranscriptionResult>(response);
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
};

/**
 * Retrieves the transcription for an audio file
 * @param fileId The ID of the audio file
 * @returns A promise that resolves to a TranscriptionResult
 */
export const getTranscription = async (
  fileId: string,
): Promise<TranscriptionResult> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/media/${fileId}/transcription`,
    );
    return handleResponse<TranscriptionResult>(response);
  } catch (error) {
    console.error('Error getting transcription:', error);
    throw error;
  }
};

/**
 * Gets synchronized transcription data for real-time highlighting
 * @param fileId The ID of the audio file
 * @param currentTime The current playback time in seconds
 * @returns A promise that resolves to a SyncTranscriptionResponse
 */
export const getSyncTranscription = async (
  fileId: string,
  currentTime: number,
): Promise<SyncTranscriptionResponse> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/media/${fileId}/transcription/sync`,
      {
        method: 'POST',
        body: JSON.stringify({ currentTime }),
      },
    );
    return handleResponse<SyncTranscriptionResponse>(response);
  } catch (error) {
    console.error('Error getting synchronized transcription:', error);
    throw error;
  }
};

// Export the transcription API object for convenience
export const transcriptionApi = {
  transcribe: transcribeAudio,
  getTranscription,
  getSyncTranscription,
};
