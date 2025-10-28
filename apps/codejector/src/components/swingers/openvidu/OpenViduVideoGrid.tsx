import React from 'react';
import { Box } from '@mui/material';

import { IOpenViduPublisher, IOpenViduSubscriber } from '@/components/swingers/types';
import { OpenViduVideoRenderer } from './OpenViduVideoRenderer';

// --- Interfaces ---
interface OpenViduVideoGridProps {
  publisher: IOpenViduPublisher | null;
  subscribers: IOpenViduSubscriber[];
}

// --- Styles --- //
const videoContainerSx = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '16px',
  marginTop: '24px',
  width: '100%',
};

export const OpenViduVideoGrid: React.FC<OpenViduVideoGridProps> = ({
  publisher,
  subscribers,
}) => {
  const allStreams = [];
  if (publisher) {
    allStreams.push({ streamManager: publisher, isLocal: true });
  }
  subscribers.forEach((sub) => allStreams.push({ streamManager: sub, isLocal: false }));
  //console.log(allStreams[1], allStreams[1].streamManager);
  return (
    <Box sx={videoContainerSx} className="max-w-7xl">
      {allStreams.map(({ streamManager, isLocal }) => (
        <OpenViduVideoRenderer
          key={streamManager.streamId}
          streamManager={streamManager}
          isLocal={isLocal}
        />
      ))}
    </Box>
  );
};
