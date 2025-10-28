import React, { useEffect, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  CircularProgress,
  Alert,
} from '@mui/material'; // Removed Typography as title is moved to header
import { streamerStore, fetchStreamers } from './stores/streamerStore';
import { StreamerCard } from './StreamerCard';
import { openViduActiveSessionsMap } from './stores/openViduEntitiesStore'; // NEW: Import active sessions map
import { IStreamerEntity } from './types';

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

export const StreamerList: React.FC = () => {
  const { streamers, loading, error } = useStore(streamerStore);
  const $openViduActiveSessionsMap = useStore(openViduActiveSessionsMap); // NEW: Get active OpenVidu sessions

  useEffect(() => {
    fetchStreamers();
  }, []);

  // NEW: Augment streamers with live status based on active OpenVidu sessions
  const streamersWithLiveStatus = useMemo(() => {
    if (!streamers || streamers.length === 0) return [];
    if (Object.keys($openViduActiveSessionsMap).length === 0) {
      return streamers.map(streamer => ({ ...streamer, isLive: false }));
    }

    const augmentedStreamers: (IStreamerEntity & { isLive: boolean })[] = [];

    streamers.forEach(streamer => {
      let isLive = false;
      if (streamer.streamId) { // Only check if the streamer has an OpenVidu streamId
        // Iterate through all active OpenVidu sessions
        for (const sessionId in $openViduActiveSessionsMap) {
          const session = $openViduActiveSessionsMap[sessionId];
          // Iterate through connections within each session
          if (session.connections?.content) {
            for (const connection of session.connections.content) {
              // Check if any publisher in this connection has a streamId matching the streamer's streamId
              if (connection.publishers) {
                if (connection.publishers.some(p => p.streamId === streamer.streamId)) {
                  isLive = true;
                  break; // Found a match, no need to check further connections/sessions for this streamer
                }
              }
            }
          }
          if (isLive) break; // Found a match, move to next streamer
        }
      }
      augmentedStreamers.push({ ...streamer, isLive });
    });

    return augmentedStreamers;
  }, [streamers, $openViduActiveSessionsMap]);

  return (
    <Box sx={listContainerSx} className="w-full flex flex-col items-center py-4 h-full">
      {/* Title removed, now handled by StreamerHeader component in SwingersPage.tsx */}
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

      {!loading && !error && streamers.length === 0 && (
        <Alert severity="info" className="max-w-xl">
          No active streamers found.
        </Alert>
      )}

      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 w-full max-w-7xl justify-items-center">
        {!loading &&
          streamersWithLiveStatus.map((streamer) => (
            <StreamerCard key={streamer.id} streamer={streamer} isLive={streamer.isLive} />
          ))}
      </Box>
    </Box>
  );
};
