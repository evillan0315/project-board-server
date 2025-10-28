import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  Typography,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LiveTvIcon from '@mui/icons-material/LiveTv'; // Import LiveTvIcon
import { roomStore, fetchRooms } from './stores/roomStore'; // Removed fetchConnectionCountsForRooms from import
import { fetchDefaultConnection } from './stores/connectionStore';
import { deleteSession, createSession } from '@/components/swingers/api/sessions';
import { IRoom } from '@/components/swingers/types'; // Import ISession

import { useNavigate } from 'react-router-dom';
import { showDialog } from '@/stores/dialogStore';
import { RoomConnectionDialog } from '@/components/swingers/dialogs/RoomConnectionDialog';
import { RoomCard } from './RoomCard';
import { RoomConnectionsTable } from './RoomConnectionsTable'; // New import
import { fetchSessionConnections } from './stores/connectionStore';
import Loading from '@/components/Loading'; // Import the new Loading component
// MODIFIED: Import openViduEntitiesStore for loading/error, and openViduActiveSessionsMap (the new computed store)
import { openViduEntitiesStore, openViduActiveSessionsMap, fetchOpenViduSessions } from './stores/openViduEntitiesStore'; 

const listContainerSx = {
  padding: '0 24px 24px 24px', // Modified: Removed top padding
  '@media (max-width: 600px)': {
    padding: '0 16px 16px 16px', // Modified: Removed top padding
  },
};

// Simplified loadingContainerSx, as Loading component handles most layout
const loadingContainerSx = {
  minHeight: '200px',
  width: '100%',
};

const errorAlertSx = {
  marginBottom: '16px',
  width: '100%',
};

const accordionSummarySx = {
  backgroundColor: 'background.paper',
  borderBottom: '1px solid',
  borderColor: 'divider',
  '& .MuiAccordionSummary-content': {
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '12px 0',
  },
};

const accordionDetailsSx = {
  padding: '16px',
};

export const RoomList: React.FC = () => {
  const { rooms, loading, error, connectionCounts, loadingConnectionCounts } = useStore(roomStore);
  // MODIFIED: Use separate useStore hooks for the main store (for loading/error)
  // and the new computed store (for the active sessions map itself).
  const { loading: loadingOpenViduEntities, error: openViduEntitiesError } = useStore(openViduEntitiesStore);
  const $openViduActiveSessionsMap = useStore(openViduActiveSessionsMap); // Use the new computed store directly

  const [resettingRoomId, setResettingRoomId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | false>('public');
  const navigate = useNavigate();

  const overallLoading = loading || loadingOpenViduEntities;
  const overallError = error || openViduEntitiesError;

  useEffect(() => {
    fetchDefaultConnection();
    fetchRooms();
    fetchOpenViduSessions();
  }, []); 

  // NEW LOGIC: Augment rooms with live status based on active OpenVidu sessions from the central store
  const roomsWithSessionStatus = useMemo(() => {
    if (!rooms || rooms.length === 0) return [];
    
    // Get current OpenVidu sessions from the computed store's value
    const activeSessionIds = new Set(Object.keys($openViduActiveSessionsMap));
    console.log(activeSessionIds, 'activeSessionIds');
    return rooms.map(room => {
      // Determine if the room's OpenVidu ID (roomId) has a corresponding active session
      const isActive = room.roomId ? activeSessionIds.has(room.roomId) : false;
      return {
        ...room,
        active: isActive      // Set room's 'active' status based on session presence
      };
    });
  }, [rooms, $openViduActiveSessionsMap]); // MODIFIED: Depend on the value of the computed store

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  // Callback for joining a room (navigates to OpenVidu page)
  const handleJoinRoom = useCallback(
    (roomId: string) => {
      // To do: implement logic for connecting to room. Connection should open in a dialog modal
      // This is currently unused, `onConnectDefaultClient` is used for connecting
    },
    [],
  );

  // Callback for viewing room details (navigates to OpenVidu page)
  const handleViewRoom = useCallback(
    (roomId: string) => {
      // To do: implement logic for Viewing room details. Connection should open in a dialog modal
      showDialog({
      title: `View Room: ${roomId}`,
      content: <RoomConnectionDialog roomId={roomId} connectionRole={'PUBLISHER'} />,
      maxWidth: 'md',
      fullWidth: true,
      showCloseButton: true,
    });
    },
    [],
  );

  // Callback for resetting/recreating a room's OpenVidu session
  const handleResetRoom = useCallback(
    async (room: IRoom) => { // MODIFIED: Accepts full room object
      if (!room || !room.roomId) {
        console.error('Cannot reset room: room object or roomId is missing.');
        return;
      }

      setResettingRoomId(room.roomId); // Set loading state for this specific room
      try {
        if (room.active) { // Check if the room has an active session
          // 1. Delete the existing OpenVidu session
          await deleteSession(room.roomId);
          console.log(`OpenVidu session ${room.roomId} deleted.`);
        }

        // 2. Create a new OpenVidu session with the same customSessionId
        // The createSession API function now handles 409 (conflict/already exists) by returning the existing session
        // So, if we deleted it, it will be truly recreated. If delete failed silently, createSession would return the existing.
        await createSession({ customSessionId: room.roomId });
        console.log(`OpenVidu session ${room.roomId} ${room.active ? 'recreated' : 'created'}.`);

        // 3. Refresh sessions and connection counts to update UI reactively
        fetchOpenViduSessions(); // Refresh the global list of sessions
        fetchSessionConnections(room.roomId); // Re-fetch connections for this specific room to update its count
      } catch (error) {
        console.error(`Error resetting room ${room.roomId}:`, error);
        // TODO: Implement a global snackbar/toast for user feedback
      } finally {
        setResettingRoomId(null); // Clear loading state
      }
    },
    [], // Dependencies are stable (functions from imports), so empty array is appropriate.
  );

  // New callback for opening the connection dialog with a specific roomId
  const handleConnectDefaultClient = useCallback((roomId: string) => {
    showDialog({
      title: `Connect to Room: ${roomId}`,
      content: <RoomConnectionDialog roomId={roomId} connectionRole={'PUBLISHER'} />,
      maxWidth: 'md',
      fullWidth: true,
      showCloseButton: true,
    });
  }, []);

  // New callback for viewing connections in a dialog
  const handleViewConnections = useCallback((roomId: string) => {
    showDialog({
      title: `Room Connections ${roomId}`,
      content: <RoomConnectionsTable roomId={roomId} />,
      maxWidth: 'lg',
      fullWidth: true,
      showCloseButton: true,
      paperPropsSx: {
        maxHeight: '80vh', // Limit dialog height
        display: 'flex',
        flexDirection: 'column',
      },
    });
  }, []);

  // NEW: Callback for opening the chat room page
  const handleOpenChat = useCallback((roomId: string) => {
    if (!roomId) {
      console.warn('Attempted to open chat for a room with no ID.');
      return;
    }
    // Ensure roomId is URL-encoded for safety, especially if it contains special characters
    const encodedRoomId = encodeURIComponent(roomId);
    navigate(`/apps/swingers/room/${encodedRoomId}/chat`);
  }, [navigate]);

  // Memoize grouped and sorted rooms to prevent unnecessary re-renders
  const allSortedRooms = useMemo(() => {
    if (overallLoading || overallError || roomsWithSessionStatus.length === 0) return []; // Use roomsWithSessionStatus here

    const sorted = [...roomsWithSessionStatus].sort((a, b) => { // Sort roomsWithSessionStatus
      const aConnections = a.roomId ? connectionCounts[a.roomId] || 0 : 0;
      const bConnections = b.roomId ? connectionCounts[b.roomId] || 0 : 0;

      // 1. Live rooms first (based on active OpenVidu session)
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;

      // If both are active or both are not active, proceed to secondary sorts
      // 2. More connections first (descending)
      if (aConnections !== bConnections) return bConnections - aConnections;

      // 3. 'public' type first, then alphabetical by type
      const aTypeLower = a.type?.toLowerCase();
      const bTypeLower = b.type?.toLowerCase();
      if (aTypeLower === 'public' && bTypeLower !== 'public') return -1;
      if (aTypeLower !== 'public' && bTypeLower === 'public') return 1;
      if (aTypeLower && bTypeLower && aTypeLower !== bTypeLower) return aTypeLower.localeCompare(bTypeLower);

      // 4. Alphabetical by name (for stable sort)
      return a.name.localeCompare(b.name);
    });

    return sorted;
  }, [overallLoading, overallError, roomsWithSessionStatus, connectionCounts]); // roomsWithSessionStatus as dependency

  const sortedLiveRooms = useMemo(() => allSortedRooms.filter((room) => room.active), [allSortedRooms]);
  const sortedNonLiveRooms = useMemo(() => allSortedRooms.filter((room) => !room.active), [allSortedRooms]);

  const groupedNonLiveRooms = useMemo(() => {
    const grouped: Record<string, IRoom[]> = {};
    sortedNonLiveRooms.forEach((room) => {
      if (!grouped[room.type]) {
        grouped[room.type] = [];
      }
      grouped[room.type].push(room);
    });

    const sortedTypes = Object.keys(grouped).sort((a, b) => {
      if (a.toLowerCase() === 'public') return -1;
      if (b.toLowerCase() === 'public') return 1;
      return a.localeCompare(b);
    });

    const finalGrouped: Record<string, IRoom[]> = {};
    sortedTypes.forEach((type) => {
      finalGrouped[type] = grouped[type];     });
    return finalGrouped;
  }, [sortedNonLiveRooms]);

  

  return (
    <Box sx={listContainerSx} className="w-full flex flex-col items-center h-full">


      {overallError && (
        <Alert severity="error" sx={errorAlertSx} className="max-w-xl">
          {overallError}
        </Alert>
      )}

      {overallLoading && !overallError && (
   <Box sx={loadingContainerSx}>
<Loading type="circular" message="Loading rooms and sessions..." />
</Box>
)}

      {!overallLoading && !overallError && roomsWithSessionStatus.length === 0 && (
<Alert severity="info" className="max-w-xl">
          No rooms found.
        </Alert>
      )}

      {!overallLoading && !overallError && roomsWithSessionStatus.length > 0 && ( 

<Box className="w-full flex flex-col gap-4">
          {sortedLiveRooms.length > 0 && (
            <Accordion
              key="live-rooms"
              expanded={expanded === 'live-rooms'}
              onChange={handleChange('live-rooms')}
              className="w-full shadow-md rounded-lg overflow-hidden "
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="live-rooms-content"
                id="live-rooms-header"
                sx={accordionSummarySx}
              >
                <Typography variant="h6" component="span" className="font-semibold text-lg text-red-500">
                  <LiveTvIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Live Sessions
                </Typography>
                <Typography variant="body2" color="text.secondary" className="ml-4">
                  ({sortedLiveRooms.length} {sortedLiveRooms.length === 1 ? 'room' : 'rooms'})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={accordionDetailsSx}>
                <Box className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3   gap-6 w-full justify-items-center">
                  {sortedLiveRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      connectionCount={room.roomId ? connectionCounts[room.roomId] : null}
                      loadingConnections={room.roomId ? loadingConnectionCounts[room.roomId] || false : false}
                      onJoinRoom={handleJoinRoom}
                      onViewRoom={handleViewRoom}
                      onResetRoom={(r) => handleResetRoom(r)} 
                      resettingRoomId={resettingRoomId}
                      onConnectDefaultClient={handleConnectDefaultClient} 
                      onViewConnections={handleViewConnections} 
                      onOpenChat={handleOpenChat}
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {Object.entries(groupedNonLiveRooms).map(([type, roomsForType]) => (
            <Accordion
              key={type}
              expanded={expanded === type}
              onChange={handleChange(type)}
              className="w-full shadow-md rounded-lg overflow-hidden"
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`${type}-content`}
                id={`${type}-header`}
                sx={accordionSummarySx}
              >
                <Typography variant="h6" component="span" className="font-semibold text-lg">
                  {type.charAt(0).toUpperCase() + type.slice(1)} Rooms
                </Typography>
                <Typography variant="body2" color="text.secondary" className="ml-4">
                  ({roomsForType.length} {roomsForType.length === 1 ? 'room' : 'rooms'})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={accordionDetailsSx}>
                <Box className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-6 w-full justify-items-center">
                  {roomsForType.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      connectionCount={room.roomId ? connectionCounts[room.roomId] : null}
                      loadingConnections={room.roomId ? loadingConnectionCounts[room.roomId] || false : false}
                      onJoinRoom={handleJoinRoom}
                      onViewRoom={handleViewRoom}
                      onResetRoom={(r) => handleResetRoom(r)} // MODIFIED: Pass the full room object
                      resettingRoomId={resettingRoomId}
                      onConnectDefaultClient={handleConnectDefaultClient} // Pass new handler
                      onViewConnections={handleViewConnections} // Pass the new handler
                      onOpenChat={handleOpenChat} 
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
};
