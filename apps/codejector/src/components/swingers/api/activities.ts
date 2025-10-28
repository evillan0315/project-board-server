import { handleResponse, fetchWithToken, SLS_API_URL, SWINGERS_ACTIVITIES, SLS_API_KEY } from './fetch';
import { IActivity  } from '@/components/swingers/types';

export const getDefaultClient = async (): Promise<IActivity[]> => {
  try {
    const response = await fetch(`${SWINGERS_ACTIVITIES}?token=${SLS_API_KEY}&_sort=created_at:DESC&_limit=10`);
    return handleResponse<IActivity[]>(response);
  } catch (error) {
    console.error(`Error fetching default activity`, error);
    throw error;
  }
};