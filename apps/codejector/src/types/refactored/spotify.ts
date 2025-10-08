// /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/project-board-front/src/types/refactored/spotify.ts
import { MediaFileResponseDto, FileType } from './media'; // Explicitly import MediaFileResponseDto and FileType
// REMOVE THIS LINE: export * from './media'; // This causes circular dependency

/**
 * Defines the repeat mode for media playback.
 */
export type RepeatMode = 'off' | 'context' | 'track';

/**
 * Represents a buffered time range in seconds.
 */
export interface BufferedRange {
  start: number;
  end: number;
}

/**
 * Frontend-specific Track interface, representing a playable item in the Spotify-like app.
 * It is derived from `MediaFileResponseDto` but includes all necessary properties for UI display and playback,
 * including a direct `mediaSrc` URL.
 */
export interface Track {
  id: string; // Unique ID for the track (typically MediaFile ID)
  title: string;
  artist?: string;
  album?: string;
  coverArt?: string; // URL for cover art, if available
  duration?: number; // Duration in seconds, if available
  mediaSrc: string; // The direct stream URL for playback (can be audio or video)
  // Include other relevant MediaFileResponseDto properties that are useful for a Track
  fileType: FileType; // Use indexed access type
  mimeType?: MediaFileResponseDto['mimeType'];
  size?: MediaFileResponseDto['size'];
  provider?: MediaFileResponseDto['provider'];
  url?: MediaFileResponseDto['url'];
  createdAt: MediaFileResponseDto['createdAt'];
  updatedAt: MediaFileResponseDto['updatedAt'];
  createdById: MediaFileResponseDto['createdById'];
  folderId?: MediaFileResponseDto['folderId'];
  content?: MediaFileResponseDto['content'];
  mediaFileId: string; // Keep a reference to the original media file ID
  songId?: string | null;
  videoId?: string | null;
  song?: any | null;
  video?: any | null;
}

/**
 * Frontend-specific Playlist interface, representing a curated collection of tracks.
 * It's a view model that aggregates data from `PlaylistResponseDto` and `Track` objects.
 */
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  cover: string; // URL for playlist cover (e.g., first track's cover or a default image)
  tracks: Track[]; // Array of frontend Track objects
  trackCount: number; // Total number of tracks in the playlist
}

// --- Backend API DTOs (remain as they were, but now in the refactored location) ---

/**
 * DTO matching the backend's CreatePlaylistDto payload for direct playlist creation.
 */
export interface CreatePlaylistApiDto {
  name: string;
  description?: string;
  isPublic?: boolean;
}

/**
 * Frontend-specific request DTO for creating a playlist.
 * Can include an optional list of media file IDs to be added during creation.
 * This is used by the frontend to send to the API.
 */
export interface PlaylistCreationRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
  mediaFileIds?: string[]; // Optional array of MediaFile IDs to include initially
}

/**
 * DTO for updating a playlist (matches backend).
 */
export interface UpdatePlaylistDto {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

/**
 * DTO for adding/removing media to/from a playlist (matches backend).
 */
export interface AddRemoveMediaToPlaylistDto {
  mediaFileId: string;
  order?: number; // Optional order for adding media
}

/**
 * DTO for a track within a playlist response from the backend.
 * Includes the full media file details nested.
 */
export interface PlaylistTrackResponseDto {
  id: string; // PlaylistMediaFile ID
  playlistId: string;
  fileId: string;
  createdAt: string;
  updatedAt: string;
  order: number;
  file: MediaFileResponseDto; // Full media file details
}

/**
 * DTO for a playlist response from the backend.
 * Contains an array of `PlaylistTrackResponseDto` for its tracks.
 */
export interface PlaylistResponseDto {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  playlistMediaFiles: PlaylistTrackResponseDto[]; // Tracks are nested under playlistMediaFiles
  trackCount?: number; // Added trackCount from backend PlaylistResponseDto
}

/**
 * DTO for playlist pagination queries (matches backend).
 */
export interface PaginationPlaylistQueryDto {
  page?: number;
  pageSize?: number;
  name?: string;
  isPublic?: boolean;
}

/**
 * DTO for paginated playlist results from the backend.
 */
export interface PaginationPlaylistResultDto {
  items: PlaylistResponseDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * DTO for creating a PlaylistMediaFile (matches backend).
 */
export interface CreatePlaylistMediaFileDto {
  playlistId: string;
  fileId: string;
  order: number;
  createdById: string;
}

/**
 * DTO for updating a PlaylistMediaFile (matches backend).
 */
export interface UpdatePlaylistMediaFileDto {
  playlistId?: string;
  fileId?: string;
  order?: number;
  createdById?: string;
}

/**
 * DTO for PlaylistMediaFile response (derived from backend DTO + timestamps/ID).
 */
export interface PlaylistMediaFileResponseDto
  extends CreatePlaylistMediaFileDto {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for PlaylistMediaFile pagination queries (matches backend).
 */
export interface PaginationPlaylistMediaFileQueryDto {
  page?: number;
  pageSize?: number;
  playlistId?: string;
  fileId?: string;
  order?: number;
  createdById?: string;
}

/**
 * DTO for paginated PlaylistMediaFile results (matches backend).
 */
export interface PaginationPlaylistMediaFileResultDto {
  items: PlaylistMediaFileResponseDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
