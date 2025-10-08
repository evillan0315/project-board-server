import { API_BASE_URL, ApiError, handleResponse, fetchWithAuth } from '@/api';

import {
  RecordingStartResponse,
  RecordingStopResponse,
  PaginationRecordingQueryDto,
  PaginationRecordingResultDto,
  TranscodeToGifDto,
  RecordingResultDto,
  UpdateRecordingDto,
  TranscodeToGifResult,
  RecordingStatusDto,
  StartCameraRecordingDto,
  CameraRecordingResponseDto,
} from '@/types';

export const recordingApi = {
  startRecording: async () => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/recording/record-start`,
        {
          method: 'POST',
        },
      );
      return handleResponse<RecordingStartResponse>(response);
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  },
  stopRecording: async (id: string) => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/recording/record-stop?id=${id}`,
        {
          method: 'POST',
        },
      );
      return handleResponse<RecordingStopResponse>(response);
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  },
  capture: async () => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/recording/capture`,
        {
          method: 'POST',
        },
      );
      return handleResponse<RecordingStopResponse>(response);
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      throw error;
    }
  },
  recordingStatus: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/recording/status`);
      return handleResponse<RecordingStatusDto>(response);
    } catch (error) {
      console.error('Error getting recording status:', error);
      throw error;
    }
  },
  startCameraRecording: async (dto: StartCameraRecordingDto) => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/recording/camera-record-start`,
        {
          method: 'POST',
          body: JSON.stringify(dto),
        },
      );
      return handleResponse<CameraRecordingResponseDto>(response);
    } catch (error) {
      console.error('Error starting camera recording:', error);
      throw error;
    }
  },
  stopCameraRecording: async (id: string) => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/recording/camera-record-stop?id=${id}`,
        {
          method: 'POST',
        },
      );
      return handleResponse<CameraRecordingResponseDto>(response);
    } catch (error) {
      console.error('Error stopping camera recording:', error);
      throw error;
    }
  },
  convertToGif: async (dto: TranscodeToGifDto) => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/ffmpeg/transcode-gif`,
        {
          method: 'POST',
          body: JSON.stringify(dto),
        },
      );
      return handleResponse<TranscodeToGifResult>(response);
    } catch (error) {
      console.error('Error converting to GIF:', error);
      throw error;
    }
  },
  getRecordings: async (
    query: PaginationRecordingQueryDto = {},
  ): Promise<PaginationRecordingResultDto> => {
    try {
      const queryString = new URLSearchParams(
        query as Record<string, any>,
      ).toString();
      const response = await fetchWithAuth(
        `${API_BASE_URL}/recording/paginated?${queryString}`,
        {
          method: 'GET',
        },
      );
      return handleResponse<PaginationRecordingResultDto>(response);
    } catch (error) {
      console.error('Error fetching paginated recordings:', error);
      throw error;
    }
  },
  getRecording: async (id: string): Promise<RecordingResultDto> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/recording/${id}`, {
        method: 'GET',
      });
      return handleResponse<RecordingResultDto>(response);
    } catch (error) {
      console.error('Error fetching recording:', error);
      throw error;
    }
  },
  updateRecording: async (
    id: string,
    dto: UpdateRecordingDto,
  ): Promise<UpdateRecordingDto> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/recording/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
      return handleResponse<UpdateRecordingDto>(response);
    } catch (error) {
      console.error('Error updating recording:', error);
      throw error;
    }
  },
  findRecording: async (id: string): Promise<RecordingResultDto> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/recording/${id}`, {
        method: 'GET',
      });
      return handleResponse<RecordingResultDto>(response);
    } catch (error) {
      console.error('Error fetching recording:', error);
      throw error;
    }
  },
  deleteRecording: async (id: string): Promise<void> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/recording/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || `API error: ${response.status}`);
      }
      return;
    } catch (error) {
      console.error('Error deleting recording:', error);
      throw error;
    }
  },
};
