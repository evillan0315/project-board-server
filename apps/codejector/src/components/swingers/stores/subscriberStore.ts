import { map } from 'nanostores';
import { ISwingerSessionParticipant, ISubscriber } from '@/components/swingers/types';
import { getSubscribers } from '@/components/swingers/api/subscribers';

interface SubscriberStoreState {
  subscribers: ISubscriber[];
  loading: boolean;
  error: string | null;
}

export const subscriberStore = map<SubscriberStoreState>({
  subscribers: [],
  loading: false,
  error: null,
});

export const fetchSubscribers = async () => {
  subscriberStore.setKey('loading', true);
  subscriberStore.setKey('error', null);
  try {
    const data = await getSubscribers();
    console.log(data, 'data')
    subscriberStore.setKey('subscribers', data);
  } catch (err) {
    console.error('Failed to fetch subscribers:', err);
    subscriberStore.setKey('error', 'Failed to load subscribers. Please try again.');
    subscriberStore.setKey('subscribers', []);
  } finally {
    subscriberStore.setKey('loading', false);
  }
};
