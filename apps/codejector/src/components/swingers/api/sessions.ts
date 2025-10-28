import { fetchWithBasicAuth, handleResponse, ApiError, API_SESSIONS_BASE_URL, SLS_VIDU_URL } from './fetch';
import { ISession } from '@/components/swingers/types';

// NOTE: These API calls interact directly with the OpenVidu server via a proxy.
// The `fetchWithBasicAuth` uses the VITE_SLS_API_KEY environment variable directly from the frontend.
// In a production environment, it is recommended to proxy these calls through your own backend
// to keep the OpenVidu secret server-side and only expose a generated token to the frontend.


/**
 * Options for creating a new OpenVidu session.
 * Corresponds to the body for POST /openvidu/api/sessions
 */
export interface ICreateSessionOptions {
  customSessionId?: string; // OpenVidu custom session ID
  mediaMode?: 'ROUTED' | 'RELAYED'; // 'ROUTED' by default if not specified
  recordingMode?: 'MANUAL' | 'ALWAYS'; // 'MANUAL' by default if not specified
  defaultRecordingProperties?: {
    name?: string;
    hasAudio?: boolean;
    hasVideo?: boolean;
    outputMode?: 'COMPOSED' | 'INDIVIDUAL';
    recordingLayout?: 'BEST_FIT' | 'CUSTOM' | 'PICTURE_IN_PICTURE' | 'VERTICAL_PRESENTATION' | 'HORIZONTAL_PRESENTATION';
    resolution?: string;
    frameRate?: number;
    shmSize?: number;
  };
}

/**
 * Creates or initializes a new OpenVidu session.
 * Corresponds to: POST /openvidu/api/sessions
 * @param options Optional parameters for session creation, such as customSessionId or mediaMode.
 * @returns A promise that resolves to the created ISession object (new or existing).
 */
export const createSession = async (options?: ICreateSessionOptions): Promise<ISession> => {
  try {
    const response = await fetchWithBasicAuth<ISession>(
      API_SESSIONS_BASE_URL,
      {
        method: 'POST',
        data: options || {},
      },
    );

    return handleResponse<ISession>(response);
  } catch (error: unknown) {
    // Cast error to a more general type for robust property access at runtime
    const err = error as { statusCode?: number; message?: string; };

    if (err && err.statusCode === 409) {
      console.warn(`Session with ID ${options?.customSessionId} already exists. Attempting to retrieve existing session.`);
      if (options?.customSessionId) {
        try {
          // If session already exists (409 Conflict), try to fetch the existing session
          const existingSession = await getSession(options.customSessionId);
          return existingSession;
        } catch (getSessionError: unknown) {
          console.error(`Failed to retrieve existing session ${options.customSessionId} after 409 conflict:`, getSessionError);
          throw new Error(`Failed to create or retrieve OpenVidu session '${options.customSessionId}' due to conflict or subsequent error.`);
        }
      } else {
        throw new Error('OpenVidu session already exists, but no customSessionId was provided to retrieve it.');
      }
    }
    console.error(`Error creating OpenVidu session:`, error);
    throw error; // Re-throw if it's not a 409 or 409 handling failed.
  }
};

/**
 * Fetches all active OpenVidu sessions.
 * Corresponds to: GET /openvidu/api/sessions
 * @returns A promise that resolves to an array of ISession objects.
 */
export const getSessions = async (): Promise<ISessionList> => {
  try {
    // The OpenVidu API returns a JSON object with a 'content' array for sessions
    const response = await fetchWithBasicAuth<ISessionList>(
    `${API_SESSIONS_BASE_URL}`,
      { method: 'GET' },
    );
    return handleResponse<ISessionList>(response);
  } catch (error) {
    console.error(
      `Error fetching OpenVidu sessions:`,
      error,
    );
    throw error;
  }
};

/**
 * Fetches a specific OpenVidu session by its ID.
 * Corresponds to: GET /openvidu/api/sessions/<SESSION_ID>
 * @param sessionId The ID of the session to fetch.
 * @returns A promise that resolves to a single ISession object.
 */
export const getSession = async (sessionId: string): Promise<ISession> => {
  try {
    const response = await fetchWithBasicAuth<ISession>(
      `${API_SESSIONS_BASE_URL}/${sessionId}`,
      { method: 'GET' },
    );
    return handleResponse<ISession>(response);
  } catch (error) {
    console.error(
      `Error fetching OpenVidu session with ID ${sessionId}:`,
      error,
    );
    throw error;
  }
};

/**
 * Deletes a specific OpenVidu session by its ID.
 * Corresponds to: DELETE /openvidu/api/sessions/<SESSION_ID>
 * @param sessionId The ID of the session to delete.
 * @returns A promise that resolves when the session is successfully deleted.
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    const response = await fetchWithBasicAuth<void>(
      `${API_SESSIONS_BASE_URL}/${sessionId}`,
      { method: 'DELETE' },
    );
    handleResponse<void>(response);
  } catch (error) {
    console.error(
      `Error deleting OpenVidu session with ID ${sessionId}:`,
      error,
    );
    throw error;
  }
};
