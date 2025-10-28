import { ISwingerSessionParticipant } from '@/components/swingers/types';

/**
 * Filters an array of subscribers to return only unique ones based on their 'id'.
 * @param subscribers The array of subscribers to filter.
 * @returns An array containing only unique subscribers.
 */
export const getUniqueSubscribers = (subscribers: ISwingerSessionParticipant[]): ISwingerSessionParticipant[] => {
  const seenIds = new Set<string>();
  return subscribers.filter((subscriber) => {
    if (!subscriber.id) {
      // Handle cases where subscriber might not have an ID, or skip them.
      // For now, we'll treat them as unique if no ID is present.
      // A more robust solution might require a different uniqueness key or error handling.
      return true;
    }
    if (seenIds.has(subscriber.id)) {
      return false;
    }
    seenIds.add(subscriber.id);
    return true;
  });
};
