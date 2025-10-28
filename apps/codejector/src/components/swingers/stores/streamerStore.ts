import { map } from 'nanostores';
import { IStreamerEntity } from '@/components/swingers/types';
import { getStreamers } from '@/components/swingers/api/streamers';

interface StreamerStoreState {
  streamers: IStreamerEntity[];
  loading: boolean;
  error: string | null;
}

export const streamerStore = map<StreamerStoreState>({
  streamers: [],
  loading: false,
  error: null,
});

export const fetchStreamers = async () => {
  streamerStore.setKey('loading', true);
  streamerStore.setKey('error', null);
  try {
    const data = await getStreamers();
    streamerStore.setKey('streamers', data);
  } catch (err) {
    console.error('Failed to fetch streamers:', err);
    streamerStore.setKey('error', 'Failed to load streamers. Please try again.');
    streamerStore.setKey('streamers', []);
  } finally {
    streamerStore.setKey('loading', false);
  }
};
