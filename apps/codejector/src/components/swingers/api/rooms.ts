import { fetchWithToken, handleResponse, SLS_API_URL, SWINGERS_ROOMS_BASE_URL } from './fetch';
import { IRoom, IDefaultRecordingProperties } from '@/components/swingers/types';

export interface ICreateRoomDto {
  name: string;
  type: 'club' | 'public';
  description?: string | null;
  roomId?: string; // Corresponds to customSessionId for OpenVidu if used
  agreement?: unknown | null;
  reset?: boolean;
  allowTranscoding?: boolean | null;
  recording?: boolean;
  recordingMode?: string | null; // e.g., "MANUAL"
  liveStream?: boolean;
  shortName?: string | null;
  forceVideoCodec?: string | null;
  forcedVideoCodec?: string | null;
  defaultRecordingProperties?: IDefaultRecordingProperties | null;
}

export interface IUpdateRoomDto extends Partial<ICreateRoomDto> {}

/**
 * Fetches all available rooms, filtering out inactive ones.
 * @returns A promise that resolves to an array of active IRoom objects.
 */
export const getRooms = async (): Promise<IRoom[]> => {
  try {
    const response = await fetchWithToken<IRoom[]>(
      SWINGERS_ROOMS_BASE_URL,
      { method: 'GET' },
    );
    return handleResponse<IRoom[]>(response);
  } catch (error) {
    console.error(`Error fetching rooms:`, error);
    throw error;
  }
};

/**
 * Fetches a specific room by its ID.
 * @param id The ID of the room to fetch.
 * @returns A promise that resolves to a single IRoom object.
 */
export const getRoom = async (id: number): Promise<IRoom> => {
  try {
    const response = await fetchWithToken<IRoom>(
      `${SWINGERS_ROOMS_BASE_URL}/${id}`,
      { method: 'GET' },
    );
    return handleResponse<IRoom>(response);
  } catch (error) {
    console.error(`Error fetching room with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Creates a new room.
 * @param roomData The data for the new room.
 * @returns A promise that resolves to the created IRoom object.
 */
export const createRoom = async (roomData: ICreateRoomDto): Promise<IRoom> => {
  try {
    const response = await fetchWithToken<IRoom>(
      SWINGERS_ROOMS_BASE_URL,
      {
        method: 'POST',
        data: roomData, // Use 'data' for JSON body, handled by fetchWithToken
      },
    );
    return handleResponse<IRoom>(response);
  } catch (error) {
    console.error(`Error creating room:`, error);
    throw error;
  }
};

/**
 * Updates an existing room.
 * @param id The ID of the room to update.
 * @param roomData The data to update the room with.
 * @returns A promise that resolves to the updated IRoom object.
 */
export const updateRoom = async (
  id: number,
  roomData: IUpdateRoomDto,
): Promise<IRoom> => {
  try {
    const response = await fetchWithToken<IRoom>(
      `${SWINGERS_ROOMS_BASE_URL}/${id}`,
      {
        method: 'PUT',
        data: roomData, // Use 'data' for JSON body, handled by fetchWithToken
      },
    );
    return handleResponse<IRoom>(response);
  } catch (error) {
    console.error(`Error updating room with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a specific room by its ID.
 * @param id The ID of the room to delete.
 * @returns A promise that resolves when the room is successfully deleted.
 */
export const deleteRoom = async (id: number): Promise<void> => {
  try {
    const response = await fetchWithToken<void>(
      `${SWINGERS_ROOMS_BASE_URL}/${id}`,
      { method: 'DELETE' },
    ); // No content expected, just check for successful completion
    handleResponse<void>(response);
  } catch (error) {
    console.error(`Error deleting room with ID ${id}:`, error);
    throw error;
  }
};
