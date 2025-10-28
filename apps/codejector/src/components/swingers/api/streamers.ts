import { fetchWithToken, handleResponse, SWINGERS_STREAMERS, SLS_API_KEY } from './fetch';
import { IStreamerEntity} from '@/components/swingers/types';

export const getStreamers = async (): Promise<IStreamerEntity[]> => {
  try {
    const response = await fetch(`${SWINGERS_STREAMERS}?token=${SLS_API_KEY}&_sort=created_at:DESC&_limit=100`);
    return handleResponse<IStreamerEntity[]>(response);
  } catch (error) {
    console.error(`Error fetching default streamers`, error);
    throw error;
  }
};

// Placeholder for future API calls related to streamers if any
export const getDefaultStreamers  = async (): Promise<IStreamerEntity[]> => {
   try {
     const response = await fetchWithToken<IStreamerEntity[]>(
      `${SWINGERS_STREAMERS}`,
      { method: 'GET' },
    )
     return  await handleResponse<IStreamerEntity[]>(response);
   } catch (error) {
     console.error(`Error fetching streamers:`, error);
     throw error;
   }
};
