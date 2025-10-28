import { API_BASE_URL, handleResponse, fetchWithAuth } from '@/api/fetch';
import { DevicesListDto } from '../components/recording/types/recording'; // Adjust path as needed

export const ffmpegApi = {
  getAvailableDevices: async (): Promise<DevicesListDto> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/ffmpeg/devices`, {
        method: 'GET',
      });
      return handleResponse<DevicesListDto>(response);
    } catch (error) {
      console.error('Error fetching available devices:', error);
      throw error;
    }
  },
};
