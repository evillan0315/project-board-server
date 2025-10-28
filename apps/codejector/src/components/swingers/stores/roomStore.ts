import { map } from 'nanostores';
import { IRoom, ISession, IConnectionList } from '@/components/swingers/types';
import { getRooms } from '@/components/swingers/api/rooms';
import { openViduEntitiesStore, fetchOpenViduSessions, updateSessionConnectionCount as updateOpenViduSessionConnectionCount } from '@/components/swingers/stores/openViduEntitiesStore';

interface RoomStoreState {
  rooms: IRoom[];
  loading: boolean;
  error: string | null;
  connectionCounts: Record<string, number | null>; // Map roomId to connection count
  loadingConnectionCounts: Record<string, boolean>; // Map roomId to loading state for connections (mostly false now)
}

export const roomStore = map<RoomStoreState>({
  rooms: [],
  loading: false,
  error: null,
  connectionCounts: {},
  loadingConnectionCounts: {},
});

export const fetchRooms = async () => {
  roomStore.setKey('loading', true);
  roomStore.setKey('error', null);
  try {
    const data = await getRooms();
    roomStore.setKey('rooms', data);
  } catch (err) {
    console.error('Failed to fetch rooms:', err);
    roomStore.setKey('error', 'Failed to load rooms. Please try again.');
    roomStore.setKey('rooms', []);
  } finally {
    roomStore.setKey('loading', false);
  }
};

// Listener for openViduEntitiesStore to automatically update connectionCounts
// This will run whenever the openViduEntitiesStore updates, ensuring roomStore's connectionCounts
// are always in sync with the global OpenVidu sessions.
openViduEntitiesStore.listen(({ sessions: activeOpenViduSessions }) => {
  const currentRooms = roomStore.get().rooms;
  const newConnectionCounts: Record<string, number | null> = {};
  const newLoadingState: Record<string, boolean> = {}; // These will mostly be false

  currentRooms.forEach(room => {
    if (room.roomId) {
      const session = activeOpenViduSessions[room.roomId];
      newConnectionCounts[room.roomId] = session?.connections?.numberOfElements || 0;
      newLoadingState[room.roomId] = false; // Connection count is now resolved
    }
  });

  // Only update if there are actual changes to avoid unnecessary re-renders for the RoomList component
  const currentConnectionCounts = roomStore.get().connectionCounts;
  // Check for any actual difference in connection counts or if a room was added/removed.
  const hasConnectionCountChanges = Object.keys(newConnectionCounts).some(
    (roomId) => newConnectionCounts[roomId] !== currentConnectionCounts[roomId]
  ) || Object.keys(currentConnectionCounts).length !== Object.keys(newConnectionCounts).length;

  if (hasConnectionCountChanges) {
    roomStore.setKey('connectionCounts', newConnectionCounts);
  }
  // Always update loading state, as it might represent an ongoing fetch somewhere else
  roomStore.setKey('loadingConnectionCounts', newLoadingState);
});


/**
 * @function fetchConnectionCountsForRooms
 * @description (DEPRECATED for direct component usage) This function is now largely a no-op
 * for its original purpose of fetching. Its primary purpose is to be called by other stores
 * if they need to *trigger* a re-evaluation of connection counts in `roomStore` based on the
 * *current* state of `openViduEntitiesStore`. However, the `listen` already handles this reactivity.
 *
 * It is advisable to remove calls to this function from components and rely on the `listen` hook.
 * For now, making it effectively a passthrough to avoid breaking existing code that might call it.
 *
 * @param rooms An array of IRoom objects.
 */
export const fetchConnectionCountsForRooms = async (rooms: IRoom[]) => {
  console.warn("`fetchConnectionCountsForRooms` is deprecated. Connection counts are now reactive via `openViduEntitiesStore` listener.");
  // No explicit fetch needed here, the listener on `openViduEntitiesStore` handles updates.
  // This function can remain as a no-op if no other module critically relies on its side effects other than
  // triggering the listener (which `openViduEntitiesStore` updates already do).
  // If `rooms` themselves change, the `openViduEntitiesStore.listen` will react to `currentRooms` inside.
  // So, calling this function directly from RoomList is indeed redundant now.
};

/**
 * Updates the connection count for a specific room.
 * This function now *only* delegates to `openViduEntitiesStore` to update the global source of truth.
 * The `roomStore`'s listener will then react to this global update.
 * @param roomId The ID of the room whose connection count to update.
 * @param count The new connection count for the room.
 * @param connectionsContent Optional: The actual array of connections, for full consistency with `ISession.connections.content`.
 */
export const updateRoomConnectionCount = (
  roomId: string,
  count: number,
  connectionsContent: IConnectionList['content'] = [],
) => {
  // Update the centralized openViduEntitiesStore first.
  // This update will then trigger the `roomStore`'s listener, which will re-calculate
  // `connectionCounts` for all rooms, including the one being updated here.
  updateOpenViduSessionConnectionCount(roomId, count, connectionsContent);

  // We might still want to explicitly set `loadingConnectionCounts[roomId]` to false here
  // if this update signifies that the connection count for *this specific room* has finished loading/being determined.
  // This is separate from the general re-calculation.
  roomStore.setKey('loadingConnectionCounts', {
    ...roomStore.get().loadingConnectionCounts,
    [roomId]: false,
  });
};
