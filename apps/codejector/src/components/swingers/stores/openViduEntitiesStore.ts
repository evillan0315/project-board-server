import { map, computed } from 'nanostores';
import { ISession, IConnectionList } from '@/components/swingers/types';
import { getSessions, getSession as fetchSingleSessionApi } from '@/components/swingers/api/sessions';

/**
 * @interface OpenViduEntitiesStoreState
 * @description Represents the state of the OpenViduEntities Nanostore,
 * acting as a centralized cache for all active OpenVidu sessions and their connections.
 * @property {Record<string, ISession>} sessions - A map where keys are `sessionId` and values are `ISession` objects.
 * @property {boolean} loading - Indicates if sessions are currently being fetched.
 * @property {string | null} error - Stores any error message encountered during fetching.
 */
interface OpenViduEntitiesStoreState {
  sessions: Record<string, ISession>;
  loading: boolean;
  error: string | null;
}

/**
 * @const openViduEntitiesStore
 * @description Nanostore for managing all OpenVidu session details centrally.
 * This store is the single source of truth for globally observed OpenVidu sessions
 * and their associated connection data.
 */
export const openViduEntitiesStore = map<OpenViduEntitiesStoreState>({
  sessions: {},
  loading: false,
  error: null,
});

/**
 * @const openViduActiveSessionsMap
 * @description A computed Nanostore that provides a reactive map of all active OpenVidu sessions.
 * This is derived from the `sessions` property of `openViduEntitiesStore`.
 * Components can `useStore(openViduActiveSessionsMap)` to directly get the sessions map.
 */
export const openViduActiveSessionsMap = computed(openViduEntitiesStore, (store) => store.sessions);

/**
 * @function setOpenViduEntitiesLoading
 * @description Sets the loading state for fetching OpenVidu sessions.
 * @param {boolean} loading - The loading state.
 */
export const setOpenViduEntitiesLoading = (loading: boolean) => {
  openViduEntitiesStore.setKey('loading', loading);
};

/**
 * @function setOpenViduEntitiesError
 * @description Sets an error message for fetching OpenVidu sessions.
 * @param {string | null} error - The error message.
 */
export const setOpenViduEntitiesError = (error: string | null) => {
  openViduEntitiesStore.setKey('error', error);
};

/**
 * @function addOrUpdateOpenViduSession
 * @description Adds a new OpenVidu session or updates an existing one in the store.
 * This is useful for keeping the global cache consistent when individual sessions are created or fetched.
 * @param {ISession} session - The session object to add or update.
 */
export const addOrUpdateOpenViduSession = (session: ISession) => {
  if (!session?.sessionId) {
    console.warn('Attempted to add/update session without a sessionId:', session);
    return;
  }
  openViduEntitiesStore.setKey('sessions', {
    ...openViduEntitiesStore.get().sessions,
    [session.sessionId]: session,
  });
};

/**
 * @function removeOpenViduSession
 * @description Removes an OpenVidu session from the store by its ID.
 * @param {string} sessionId - The ID of the session to remove.
 */
export const removeOpenViduSession = (sessionId: string) => {
  const currentSessions = openViduEntitiesStore.get().sessions;
  const newSessions = { ...currentSessions };
  delete newSessions[sessionId];
  openViduEntitiesStore.setKey('sessions', newSessions);
};

/**
 * @function updateSessionConnectionCount
 * @description Updates the connection count for a specific session in the store.
 * This allows for granular updates without re-fetching the entire session object.
 * @param {string} sessionId - The ID of the session to update.
 * @param {number} count - The new number of connections.
 */
export const updateSessionConnectionCount = (
  sessionId: string,
  count: number,
  connectionsContent: IConnectionList['content'] = [],
) => {
  const currentSession = openViduEntitiesStore.get().sessions[sessionId];
  if (currentSession) {
    const updatedSession: ISession = {
      ...currentSession,
      connections: {
        content: connectionsContent,
        numberOfElements: count,
      },
    };
    addOrUpdateOpenViduSession(updatedSession);
  } else {
    console.warn(`Attempted to update connection count for non-existent session: ${sessionId}`);
  }
};

/**
 * @function fetchOpenViduSessions
 * @description Fetches all active OpenVidu sessions and updates the store.
 * This function should be the primary way to load a comprehensive list of sessions.
 */
export const fetchOpenViduSessions = async () => {
  setOpenViduEntitiesLoading(true);
  setOpenViduEntitiesError(null);
  try {
    const sessionsList = await getSessions(); // This fetches an ISessionList with a 'content' array
    const sessionsMap: Record<string, ISession> = {};
    sessionsList.content.forEach((session) => {
      sessionsMap[session.sessionId] = session;
    });
    openViduEntitiesStore.setKey('sessions', sessionsMap);
  } catch (err: any) {
    console.error('Failed to fetch OpenVidu sessions globally:', err);
    setOpenViduEntitiesError(`Failed to load sessions: ${err.message || err}`);
    openViduEntitiesStore.setKey('sessions', {}); // Clear sessions on error
  } finally {
    setOpenViduEntitiesLoading(false);
  }
};

/**
 * @function refreshOpenViduSession
 * @description Fetches a single OpenVidu session by its ID and updates the store.
 * This is useful when a specific session needs to be reloaded/synchronized with the OpenVidu server.
 * @param {string} sessionId - The ID of the session to fetch.
 * @returns {Promise<ISession | null>} The fetched session, or null if an error occurred.
 */
export const refreshOpenViduSession = async (sessionId: string): Promise<ISession | null> => {
  try {
    const session = await fetchSingleSessionApi(sessionId);
    addOrUpdateOpenViduSession(session);
    return session;
  } catch (err: any) {
    console.error(`Failed to refresh OpenVidu session ${sessionId}:`, err);
    setOpenViduEntitiesError(`Failed to refresh session '${sessionId}': ${err.message || err}`);
    removeOpenViduSession(sessionId);
    return null;
  }
};
