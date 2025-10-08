import axios from 'axios';
import { getToken } from '@/stores/authStore'; // Import getToken
import {
  PlaylistResponseDto,
  PaginationPlaylistQueryDto,
  PaginationPlaylistResultDto,
  AddRemoveMediaToPlaylistDto,
  PlaylistCreationRequest, // Renamed from CreatePlaylistDto for frontend model
  CreatePlaylistApiDto, // New DTO matching backend payload
  UpdatePlaylistDto,
} from '@/types';

const API_BASE_URL = `/api`;

const playlistApi = axios.create({
  baseURL: `${API_BASE_URL}/playlists`, // Corrected base URL to match controller
  withCredentials: true,
});

// Add a request interceptor to include the Authorization header
playlistApi.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Creates a new Playlist.
 * This function now accepts `PlaylistCreationRequest` (frontend model)
 * but sends `CreatePlaylistApiDto` (backend model) for the initial playlist creation.
 * Media files are added in a separate step if provided in the request.
 */
export const createPlaylist = async (
  payload: PlaylistCreationRequest,
): Promise<PlaylistResponseDto> => {
  // Construct payload to match backend's CreatePlaylistDto
  const apiPayload: CreatePlaylistApiDto = {
    name: payload.name,
    description: payload.description,
    isPublic: payload.isPublic,
  };
  const response = await playlistApi.post<PlaylistResponseDto>('/', apiPayload);

  // If mediaFileIds are provided, add them to the playlist
  if (payload.mediaFileIds && payload.mediaFileIds.length > 0) {
    // Assuming `response.data.id` is the newly created playlist's ID
    const newPlaylistId = response.data.id;
    // Iterate and add each media file
    for (const mediaFileId of payload.mediaFileIds) {
      await addMediaToPlaylist(newPlaylistId, { mediaFileId });
    }
    // Optionally, refetch the playlist to get the updated tracks
    return fetchPlaylistById(newPlaylistId);
  }

  return response.data;
};

/**
 * Fetches a list of playlists.
 */
export const fetchPlaylists = async (
  query: PaginationPlaylistQueryDto = { page: 1, pageSize: 10 },
): Promise<PaginationPlaylistResultDto> => {
  const response = await playlistApi.get<PaginationPlaylistResultDto>(
    '/paginated',
    {
      params: query,
    },
  );
  return response.data;
};

/**
 * Fetches a single playlist by ID.
 */
export const fetchPlaylistById = async (
  id: string,
): Promise<PlaylistResponseDto> => {
  const response = await playlistApi.get<PlaylistResponseDto>(`/${id}`);
  return response.data;
};

/**
 * Updates a playlist by ID.
 */
export const updatePlaylist = async (
  id: string,
  payload: UpdatePlaylistDto,
): Promise<PlaylistResponseDto> => {
  const response = await playlistApi.patch<PlaylistResponseDto>(
    `/${id}`,
    payload,
  );
  return response.data;
};

/**
 * Deletes a playlist by ID.
 */
export const deletePlaylist = async (
  id: string,
): Promise<{ message: string }> => {
  const response = await playlistApi.delete<{ message: string }>(`/${id}`);
  return response.data;
};

/**
 * Adds a media file to a specific playlist.
 */
export const addMediaToPlaylist = async (
  playlistId: string,
  payload: AddRemoveMediaToPlaylistDto,
): Promise<PlaylistResponseDto> => {
  const response = await playlistApi.post<PlaylistResponseDto>(
    `/${playlistId}/add-media`,
    payload,
  );
  return response.data;
};

/**
 * Removes a media file from a specific playlist.
 */
export const removeMediaFromPlaylist = async (
  playlistId: string,
  payload: AddRemoveMediaToPlaylistDto,
): Promise<PlaylistResponseDto> => {
  const response = await playlistApi.post<PlaylistResponseDto>(
    `/${playlistId}/remove-media`,
    payload,
  );
  return response.data;
};
