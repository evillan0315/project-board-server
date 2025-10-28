import { fetchWithToken, handleResponse, SWINGERS_SUBSCRIBERS } from './fetch';
import { ISubscriber } from '@/components/swingers/types';


/**
 * Fetches all subscribers and returns a list of unique subscribers,
 * where uniqueness is determined by the combination of 'member.email' and 'member.username'.
 * If either 'email' or 'username' is missing for a member, a placeholder string is used
 * in the composite key to ensure proper uniqueness tracking for all entries.
 * @returns A promise that resolves to an array of unique ISubscriber objects.
 */
export const getSubscribers = async (): Promise<ISubscriber[]> => {
  try {
    const response = await fetchWithToken<ISubscriber[]>(
      `${SWINGERS_SUBSCRIBERS}`,
      { method: 'GET' },
    );
    const allSubscribers = await handleResponse<IConnection>(response);
    console.log(allSubscribers, 'allSubscribers');
    const seenKeys = new Set<string>();
    const uniqueSubscribers: ISubscriber[] = [];

    for (const subscriber of allSubscribers) {
      // Safely access member properties, using placeholders for undefined/null values
      const email = subscriber.member?.email || 'NO_EMAIL_FOUND';
      const username = subscriber.member?.username || 'NO_USERNAME_FOUND';

      // Create a composite key for uniqueness check
      const compositeKey = `${email}|${username}`;

      if (!seenKeys.has(compositeKey)) {
        seenKeys.add(compositeKey);
        uniqueSubscribers.push(subscriber);
      }
    }

    return uniqueSubscribers;
  } catch (error) {
    console.error(
      `Error fetching swingers subscribers:`,
      error,
    );
    throw error;
  }
};
