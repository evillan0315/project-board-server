import { map } from 'nanostores';
import { ISession } from '@/components/swingers/types';
import { openViduEntitiesStore, fetchOpenViduSessions as fetchOpenViduSessionsGlobally, setOpenViduEntitiesLoading, setOpenViduEntitiesError } from '@/components/swingers/stores/openViduEntitiesStore';

/**
 * @interface SessionStoreState
 * @description Represents the state of the session Nanostore.
 * @property {ISession[]} sessions - An array of OpenVidu session objects.
 * @property {boolean} loading - Indicates if sessions are currently being fetched.
 * @property {string | null} error - Stores any error message encountered during fetching.
 */
interface SessionStoreState {
  sessions: ISession[];
  loading: boolean;
  error: string | null;
}

/**
 * @const sessionStore
 * @description Nanostore for managing OpenVidu session details.
 * This store now acts as a derived view, primarily relying on `openViduEntitiesStore`
 * for the actual data fetching and caching of all OpenVidu sessions.
 */
export const sessionStore = map<SessionStoreState>({
  sessions: [],
  loading: false,
  error: null,
});

// When the global OpenVidu entities store changes, update this store's sessions array.
openViduEntitiesStore.listen(({ sessions, loading, error }) => {
  sessionStore.set({ 
    sessions: Object.values(sessions), 
    loading: loading, 
    error: error 
  });
});

/**
 * @function setSessions
 * @description Sets the sessions array in the store.
 * NOTE: This function is now deprecated. Use actions in `openViduEntitiesStore` to modify sessions,
 * which will then automatically update this `sessionStore` via its listener.
 * @param {ISession[]} sessions - The array of ISession objects.
 */
export const setSessions = (sessions: ISession[]) => {
  console.warn('`setSessions` is deprecated. Update sessions via `openViduEntitiesStore`.');
  sessionStore.setKey('sessions', sessions);
  sessionStore.setKey('error', null);
};

/**
 * @function setSessionLoading
 * @description Sets the loading state for sessions.
 * NOTE: This function is now deprecated. Loading state is managed by `openViduEntitiesStore`.
 * @param {boolean} loading - The loading state.
 */
export const setSessionLoading = (loading: boolean) => {
  console.warn('`setSessionLoading` is deprecated. Loading state is managed by `openViduEntitiesStore`.');
  sessionStore.setKey('loading', loading);
};

/**
 * @function setSessionError
 * @description Sets an error message for session fetching.
 * NOTE: This function is now deprecated. Error state is managed by `openViduEntitiesStore`.
 * @param {string | null} error - The error message.
 */
export const setSessionError = (error: string | null) => {
  console.warn('`setSessionError` is deprecated. Error state is managed by `openViduEntitiesStore`.');
  sessionStore.setKey('error', error);
};

/**
 * @function clearSessions
 * @description Resets the session store to its initial state.
 * NOTE: This function is now deprecated. To clear sessions, you would typically reset or clear
 * the `openViduEntitiesStore` (though clearing all global sessions is usually not desired).
 */
export const clearSessions = () => {
  console.warn('`clearSessions` is deprecated. Reset `openViduEntitiesStore` if full clearing is intended.');
  sessionStore.set({ sessions: [], loading: false, error: null });
};

/**
 * @function fetchSessions
 * @description Fetches all active OpenVidu sessions and updates the store.
 * This now delegates to the global `openViduEntitiesStore` to perform the actual API call.
 */
export const fetchSessions = async () => {
  // `setSessionLoading` and `setSessionError` are now handled by the listener for `openViduEntitiesStore`
  // when `fetchOpenViduSessionsGlobally` is called.
  return fetchOpenViduSessionsGlobally();
};
