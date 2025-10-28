import React from 'react';
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';
import { ISwingerSessionParticipant } from '@/components/swingers/types';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface SubscriberCardProps {
  subscriber: ISwingerSessionParticipant;
}

const cardSx = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  overflow: 'hidden',
  boxShadow: 3,
  borderRadius: 2,
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: 6,
  },
};

const contentSx = {
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: '16px',
  '&:last-child': { // Important for CardContent to override default padding
    paddingBottom: '16px',
  },
};

const infoItemSx = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '4px',
  wordBreak: 'break-word',
};

export const SubscriberCard: React.FC<SubscriberCardProps> = ({ subscriber }) => {
  const { member, room, active, streamId } = subscriber;
  const { username, email, json_data } = member;
  const { CITY, STATE, PICTUREFULL } = json_data;

  return (
    <Card sx={cardSx} className="flex-none w-full sm:w-80 md:w-full lg:w-96 min-h-60 h-auto">
      <Box className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
        <Avatar
          alt={username}
          src={PICTUREFULL || undefined}
          className="w-24 h-24 border-4 border-white shadow-lg"
          sx={{
            bgcolor: PICTUREFULL ? 'transparent' : 'primary.main',
            fontSize: '2rem',
            '@media (max-width: 600px)': {
              width: 80,
              height: 80,
              fontSize: '1.75rem',
            },
          }}
        >
          {!PICTUREFULL && username ? username[0].toUpperCase() : <PersonIcon sx={{ fontSize: '3rem' }} />} 
        </Avatar>
        <Box className="absolute top-2 right-2 flex items-center gap-1 p-1 rounded-full text-white text-xs font-semibold"
             sx={{ bgcolor: active ? 'success.main' : 'error.main' }}>
          {active ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />} 
          {active ? 'Active' : 'Inactive'}
        </Box>
      </Box>
      <CardContent sx={contentSx} className="flex flex-col flex-grow p-4">
        <Typography variant="h6" component="div" className="mb-2 font-bold text-center" color="text.primary">
          {username}
        </Typography>
        <Box sx={infoItemSx}>
          <EmailIcon color="action" fontSize="small" />
          <Typography variant="body2" color="text.secondary">
            {email}
          </Typography>
        </Box>
        {(CITY || STATE) && (
          <Box sx={infoItemSx}>
            <LocationOnIcon color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              {CITY}{CITY && STATE && ', '}{STATE}
            </Typography>
          </Box>
        )}
        <Box sx={infoItemSx}>
          <Typography variant="body2" color="text.secondary" className="font-semibold">Room:</Typography>
          <Typography variant="body2" color="text.secondary">
            {room.name || 'N/A'}
          </Typography>
        </Box>
        {streamId && (
          <Box sx={infoItemSx}>
            <Typography variant="body2" color="text.secondary" className="font-semibold">Stream ID:</Typography>
            <Typography variant="body2" color="text.secondary">
              {streamId}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
