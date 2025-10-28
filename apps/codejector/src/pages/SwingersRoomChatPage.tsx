import React from 'react';
import { useParams } from 'react-router-dom';
import PageLayout from '@/components/layouts/PageLayout';
import { ChatRoom } from '@/components/swingers/ChatRoom';
import { Box, Typography } from '@mui/material';

interface SwingersRoomChatPageParams {
  roomId: string;
}

const SwingersRoomChatPage: React.FC = () => {
  const { roomId } = useParams<SwingersRoomChatPageParams>();
  console.log(roomId, 'roomId')
  if (!roomId) {
    return (
      <PageLayout>
        <Box className="flex justify-center items-center h-full w-full">
          <Typography variant="h5" color="error">
            Error: Room ID is missing.
          </Typography>
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout header={
      <Typography variant="h6" component="h1" className="font-bold">
        Chat Room: {roomId}
      </Typography>
    }
      body={

        <Box className="w-full max-w-screen-2xl mx-auto h-full p-0 pb-2">
        <ChatRoom roomId={roomId} />
      </Box>
      }
      bodyPosition={'top'}
      centerBodyPostition={false}
      >
      {/* ChatRoom component is designed to take full width and height of its parent */}
      
    </PageLayout>
  );
};

export default SwingersRoomChatPage;
