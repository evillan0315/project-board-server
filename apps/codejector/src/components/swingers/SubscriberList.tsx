import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Box, CircularProgress, Alert } from '@mui/material'; // Removed Typography as title is moved to header
import { subscriberStore, fetchSubscribers } from './stores/subscriberStore';
import { addMembers } from './stores/memberStore'; // Import the new action
import { SubscriberCard } from './SubscriberCard';

const listContainerSx = {
  padding: '0 24px 24px 24px', // Modified: Removed top padding
  '@media (max-width: 600px)': {
    padding: '0 16px 16px 16px', // Modified: Removed top padding
  },
};

const loadingContainerSx = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '200px',
  width: '100%',
};

const errorAlertSx = {
  marginBottom: '16px',
  width: '100%',
};

export const SubscriberList: React.FC = () => {
  const { subscribers, loading, error } = useStore(subscriberStore);

  useEffect(() => {
    const loadSubscribers = async () => {
      await fetchSubscribers();
      const fetchedSubscribers = subscriberStore.get().subscribers;
      // Extract unique IMemberFull objects and add them to the memberStore
      const membersToStore = fetchedSubscribers.map(sub => sub.member).filter(Boolean);
      if (membersToStore.length > 0) {
        addMembers(membersToStore);
      }
    };
    loadSubscribers();
  }, []);

  return (
    <Box sx={listContainerSx} className="w-full flex flex-col items-center py-4 h-full">
      {/* Title removed, now handled by SubscriberHeader component in SwingersPage.tsx */}
      {loading && (
        <Box sx={loadingContainerSx}>
          <CircularProgress color="primary" size={60} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={errorAlertSx} className="max-w-xl">
          {error}
        </Alert>
      )}

      {!loading && !error && subscribers.length === 0 && (
        <Alert severity="info" className="max-w-xl">
          No subscribers found.
        </Alert>
      )}

      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 w-full max-w-7xl justify-items-center">
        {!loading &&
          subscribers.map((subscriber) => (
            <SubscriberCard key={subscriber.id} subscriber={subscriber} />
          ))}
      </Box>
    </Box>
  );
};
