import { map } from 'nanostores';
import { persistentAtom } from '@/utils/persistentAtom';
import { IConnection } from '@/components/swingers/types';
import { getConnection } from '@/components/swingers/api/connections';
import { getSession } from '@/components/swingers/api/sessions';
import { getDefaultClient } from '@/components/swingers/api/activities';
import { updateRoomConnectionCount } from '@/components/swingers/stores/roomStore';
import { addOrUpdateOpenViduSession, updateSessionConnectionCount as updateOpenViduSessionConnectionCount } from '@/components/swingers/stores/openViduEntitiesStore'; // Import actions from new store

/**
 * @interface ConnectionStoreState
 * @description Represents the state of the connection Nanostore.
 * @property {IConnection[]} connections - An array of OpenVidu connection objects for the current session.
 * @property {boolean} loading - Indicates if connections are currently being fetched.
 * @property {string | null} error - Stores any error message encountered during fetching.
 * @property {string | null} currentSessionId - The ID of the session whose connections are currently loaded.
 */
interface ConnectionStoreState {
  connections: IConnection[];
  loading: boolean;
  error: string | null;
  currentSessionId: string | null;
}

/**
 * @const connectionStore
 * @description Nanostore for managing OpenVidu connection details for the active session.
 */
export const connectionStore = map<ConnectionStoreState>({
  connections: [],
  loading: false,
  error: null,
  currentSessionId: null,
});

export const currentDefaultConnection = persistentAtom<IConnection>('currentDefaultConnection', {} as IConnection); // Initialize with an empty IConnection object

/**
 * @function setConnections
 * @description Sets the connections array and updates the current session ID.
 * @param {string} sessionId - The ID of the session.
 * @param {IConnection[]} connections - The array of IConnection objects.
 */
export const setConnections = (sessionId: string, connections: IConnection[]) => {
  connectionStore.set({
    ...connectionStore.get(),
    connections,
    currentSessionId: sessionId,
    error: null, // Clear any previous errors on successful set
  });
};

/**
 * @function deleteConnectionsFromStore
 * @description Removes specified connections from the store and updates the room connection count.
 * It also updates the global `openViduEntitiesStore`.
 * @param {string[]} connectionIds - An array of IDs of connections to delete.
 * @param {string} sessionId - The ID of the session these connections belong to.
 */
export const deleteConnectionsFromStore = (connectionIds: string[], sessionId: string) => {
  const currentConnections = connectionStore.get().connections;
  const updatedConnections = currentConnections.filter(
    (conn) => !connectionIds.includes(conn.id),
  );
  connectionStore.setKey('connections', updatedConnections);
  updateRoomConnectionCount(sessionId, updatedConnections.length, updatedConnections); // Update room store with full content
};

export const fetchDefaultConnection = async () => {
  try {
    const defaultClientActivities = await getDefaultClient();
    console.log(defaultClientActivities, 'defaultClientActivities');
    // Assuming defaultClientActivities[1] gives the relevant object
    if (defaultClientActivities && defaultClientActivities.length > 1) {
      const defaultActivity = defaultClientActivities[1];
      const participantId = defaultActivity.participantId;
      const sessionId = defaultActivity.sessionId;
      // MODIFIED: sessionId is no longer needed for `getConnection` in `api/connections.ts`
      // const sessionId = defaultActivity.sessionId;

      if (participantId) { // Check only for participantId
        const getClientConnection = await getConnection(participantId, sessionId); // MODIFIED: Call with only connectionId
        console.log(getClientConnection, 'getClientConnection')
        currentDefaultConnection.set(getClientConnection);
      } else {
        console.warn('Participant ID not found in default client connection data.');
        currentDefaultConnection.set({} as IConnection); // Clear if data is incomplete
      }
    } else {
      console.warn('No default client connection activities found or array is too short.');
      currentDefaultConnection.set({} as IConnection); // Clear if no data
    }
  } catch (error) {
    console.error('Error fetching default connection:', error);
    currentDefaultConnection.set({} as IConnection); // Clear on error
  }
};
/**
 * @function setConnectionLoading
 * @description Sets the loading state for connections.
 * @param {boolean} loading - The loading state.
 */
export const setConnectionLoading = (loading: boolean) => {
  connectionStore.setKey('loading', loading);
};

/**
 * @function setConnectionError
 * @description Sets an error message for connection fetching.
 * @param {string | null} error - The error message.
 */
export const setConnectionError = (error: string | null) => {
  connectionStore.setKey('error', error);
};

/**
 * @function clearConnections
 * @description Resets the connection store to its initial state.
 */
export const clearConnections = () => {
  connectionStore.set({
    connections: [],
    loading: false,
    error: null,
    currentSessionId: null,
  });
};

/**
 * @function fetchSessionConnections
 * @description Fetches all active OpenVidu connections for a specific session
 * and updates `connectionStore`, `roomStore`, and the `openViduEntitiesStore`.
 * @param {string} sessionId - The ID of the session to fetch connections for.
 */
export const fetchSessionConnections = async (sessionId: string) => {
  if (!sessionId) {
    console.warn('fetchSessionConnections called with null/undefined sessionId');
    clearConnections();
    return;
  }

  setConnectionLoading(true);
  setConnectionError(null);
  connectionStore.setKey('currentSessionId', sessionId); // Ensure currentSessionId is set even before fetch completes

  try {
    const session = await getSession(sessionId); // This fetches session details, including connections
    if (session && session.connections) {
      const connections = session.connections;
      const content = connections.content || [];
      const numberOfElements = connections.numberOfElements || 0;

      setConnections(sessionId, content); // Update local connection store
      updateRoomConnectionCount(sessionId, numberOfElements, content); // Update room store
      addOrUpdateOpenViduSession(session); // Update global OpenVidu entities store
    } else {
      console.warn(`Session ${sessionId} found, but no connections data.`);
      setConnections(sessionId, []); // Clear local connections
      updateRoomConnectionCount(sessionId, 0); // Update room count to 0
      updateOpenViduSessionConnectionCount(sessionId, 0); // Update global OpenVidu entities store
    }
  } catch (err: any) {
    console.error(`Failed to fetch connections for session ${sessionId}:`, err);
    setConnectionError(`Failed to load connections: ${err.message || err}`);
    setConnections(sessionId, []); // Clear local connections on error
    updateRoomConnectionCount(sessionId, 0); // Update room count to 0 on error
    updateOpenViduSessionConnectionCount(sessionId, 0); // Update global OpenVidu entities store on error
  } finally {
    setConnectionLoading(false);
  }
};
