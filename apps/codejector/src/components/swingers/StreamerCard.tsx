import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Avatar, Tooltip, IconButton, useTheme } from '@mui/material';
import { IStreamerEntity } from '@/components/swingers/types';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WifiOutlinedIcon from '@mui/icons-material/WifiOutlined'; // For connection status
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'; // For room icon

interface StreamerCardProps {
  streamer: IStreamerEntity;
  isLive: boolean; // NEW: Prop to indicate if the streamer is actively live streaming
}

const baseCardSx = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  overflow: 'hidden',
  boxShadow: 3,
  borderRadius: 2,
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: 6,
  },
};

const liveCardHighlightSx = {
  borderColor: 'error.main',
  borderWidth: '2px',
  borderStyle: 'solid',
  boxShadow: '0 0 15px rgba(255, 0, 0, 0.5)',
  transform: 'scale(1.01)',
  '&:hover': {
    transform: 'scale(1.03) translateY(-4px)',
    boxShadow: '0 0 20px rgba(255, 0, 0, 0.7)',
  },
};

const contentSx = {
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: '16px',
  '&:last-child': {
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

export const StreamerCard: React.FC<StreamerCardProps> = ({
  streamer,
  isLive,
}) => {
  const { name, active, private: isPrivate, member, room, connection, streamId, created_at, updated_at, end_date } = streamer;
  const theme = useTheme();

  // Removed internal isLive calculation. Now derived from prop.

  return (
    <Card sx={{ ...baseCardSx, ...(isLive && liveCardHighlightSx) }} className="flex-none w-full min-h-60 h-auto" elevation={2}>
      <Box className={`relative h-36 w-full overflow-hidden bg-gradient-to-br ${isLive ? 'from-red-500 to-orange-600' : 'from-indigo-500 to-purple-600'} flex items-center justify-center p-4`}>
        <Avatar
          alt={member.username}
          src={undefined} // IStreamerEntity does not expose PICTUREFULL directly
          className="w-24 h-24 border-4 border-white shadow-lg"
          sx={{
            bgcolor: 'primary.main',
            fontSize: '2rem',
            '@media (max-width: 600px)': {
              width: 80,
              height: 80,
              fontSize: '1.75rem',
            },
          }}
        >
          {member.username ? member.username[0].toUpperCase() : <PersonIcon sx={{ fontSize: '3rem' }} />}
        </Avatar>

        {isLive && (
          <Chip
            label="LIVE"
            size="small"
            icon={<LiveTvIcon fontSize="small" />}
            color="error"
            className="absolute top-2 left-2 animate-pulse font-bold z-10"
            sx={{ bgcolor: 'error.main', color: 'white', '& .MuiChip-icon': { color: 'white' } }}
          />
        )}

        <Box className="absolute top-2 right-2 flex items-center gap-1 p-1 rounded-full text-white text-xs font-semibold"
             sx={{ bgcolor: active ? 'success.main' : 'error.main' }}>
          {active ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />} 
          {active ? 'Active' : 'Inactive'}
        </Box>
      </Box>

      <CardContent sx={contentSx} className="flex flex-col flex-grow p-4">
        <Typography variant="h6" component="div" className="mb-2 font-bold text-center" color="text.primary">
          {member.username} {isPrivate && <Chip label="Private" size="small" color="warning" className="ml-2" />}
        </Typography>
        <Box className="flex justify-center flex-wrap gap-2 mb-2">
          {room.name && <Chip label={`Room: ${room.name}`} size="small" color="info" icon={<MeetingRoomIcon fontSize="small" />} />}
          {connection.platform && (
            <Tooltip title={connection.platform}>
              <Chip
                label={`Connection: ${connection.connectionId.substring(0, 8)}...`}
                size="small"
                color="secondary"
                icon={<WifiOutlinedIcon fontSize="small" />}
              />
            </Tooltip>
          )}
        </Box>

        {member.userId && (
          <Box sx={infoItemSx}>
            <Typography variant="body2" color="text.secondary" className="font-semibold">User ID:</Typography>
            <Typography variant="body2" color="text.secondary">
              {member.userId}
            </Typography>
          </Box>
        )}
        {streamId && (
          <Box sx={infoItemSx}>
            <Typography variant="body2" color="text.secondary" className="font-semibold">Stream ID:</Typography>
            <Typography variant="body2" color="text.secondary">
              {streamId}
            </Typography>
          </Box>
        )}
        {connection.ip && (
          <Box sx={infoItemSx}>
            <Typography variant="body2" color="text.secondary" className="font-semibold">IP Address:</Typography>
            <Typography variant="body2" color="text.secondary">
              {connection.ip}
            </Typography>
          </Box>
        )}
        
        <Box sx={infoItemSx}>
          <Typography variant="body2" color="text.secondary" className="font-semibold">Started:</Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date(created_at).toLocaleDateString()} {new Date(created_at).toLocaleTimeString()}
          </Typography>
        </Box>
        {end_date && (
      <Box sx={infoItemSx}>
          <Typography variant="body2" color="text.secondary" className="font-semibold">End:</Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date(updated_at).toLocaleDateString()} {new Date(updated_at).toLocaleTimeString()}
          </Typography>
        </Box>
        )}
        
      </CardContent>
    </Card>
  );
};
