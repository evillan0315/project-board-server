// /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/project-board-front/src/stores/spotifyStore.ts

import { map } from 'nanostores';
import { showGlobalSnackbar } from './aiEditorStore';
import { persistentAtom, mapMediaFileToTrack } from '@/utils';
import {
  Track,
  Playlist,
  PaginationPlaylistQueryDto,
  UpdatePlaylistDto,
  AddRemoveMediaToPlaylistDto,
  MediaFileResponseDto,
  RepeatMode,
  PlaylistCreationRequest,
  PaginationMediaQueryDto,
  FileType,
  BufferedRange, // New: Import BufferedRange
} from '@/types';
import {
  fetchPlaylists,
  fetchPlaylistById,
  createPlaylist as apiCreatePlaylist,
  updatePlaylist,
  deletePlaylist,
  addMediaToPlaylist,
  removeMediaFromPlaylist,
} from '@/api/playlist';
import {
  scanMediaDirectory as apiScanMediaDirectory,
  fetchMediaFiles as apiFetchAllMediaFiles,
  transcribeAudio,
  getTranscription,
  getSyncTranscription,
} from '@/api/media';
import { authStore } from './authStore'; // Import authStore for login check
import { TranscriptionResult, SyncTranscriptionResponse } from '@/types';

// --- Atoms (Non-persistent for transient playback state, persistent for user preferences) ---
// Playback state should NOT be persistent to avoid browser autoplay issues on refresh.
// However, the user explicitly requested these to be persistent.
export const isPlayingAtom = persistentAtom<boolean>(
  'spotify:isPlaying',
  false,
);
export const currentTrackAtom = persistentAtom<Track | null>(
  'spotify:currentTrack',
  null,
);
export const progressAtom = persistentAtom<number>('spotify:progress', 0);
export const durationAtom = persistentAtom<number>('spotify:duration', 0);
export const bufferedAtom = persistentAtom<BufferedRange[]>(
  'spotify:buffered',
  [],
); // New: Buffered ranges atom
export const isVideoModalOpenAtom = persistentAtom<boolean>(
  'spotify:isVideoModalOpen',
  false,
);

// User preferences are persistent
export const volumeAtom = persistentAtom<number>('spotify:volume', 70); // Persistent
export const repeatModeAtom = persistentAtom<RepeatMode>(
  'spotify:repeatMode',
  'off',
); // Persistent
export const shuffleAtom = persistentAtom<boolean>('spotify:shuffle', false); // Persistent

// --- Store Interface (for the map part) ---
export interface SpotifyStore {
  queue: Track[];
  history: Track[];
  currentPlaylist: Playlist | null;
  playlists: Playlist[];
  isLoadingPlaylists: boolean;
  playlistError: string | null;
  // General media related state
  allAvailableMediaFiles: MediaFileResponseDto[];
  isFetchingMedia: boolean;
  fetchMediaError: string | null;
  // Paginated audio files state
  paginatedAudioFiles: MediaFileResponseDto[];
  audioPagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  };
  isFetchingPaginatedAudio: boolean;
  fetchPaginatedAudioError: string | null;
  // Paginated video files state
  paginatedVideoFiles: MediaFileResponseDto[];
  videoPagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  };
  isFetchingPaginatedVideo: boolean;
  fetchPaginatedVideoError: string | null;
  // Media scan state
  mediaScanPath: string;
  isScanningMedia: boolean;
  mediaScanError: string | null;
  loading: boolean;
  error: string | null;

  // ADD THESE TRANSCRIPTION PROPERTIES:
  transcriptionData: TranscriptionResult | null;
  transcriptionSyncData: SyncTranscriptionResponse | null;
  isTranscribing: boolean;
  transcriptionError: string | null;
}

// --- Initial State (for the map part) ---
export const $spotifyStore = map<SpotifyStore>({
  queue: [],
  history: [],
  currentPlaylist: null,
  playlists: [],
  isLoadingPlaylists: false,
  playlistError: null,
  // General media state
  allAvailableMediaFiles: [],
  isFetchingMedia: false,
  fetchMediaError: null,
  // Paginated audio state
  paginatedAudioFiles: [],
  audioPagination: { page: 1, pageSize: 20, totalPages: 1, hasMore: false },
  isFetchingPaginatedAudio: false,
  fetchPaginatedAudioError: null,
  // Paginated video state
  paginatedVideoFiles: [],
  videoPagination: { page: 1, pageSize: 20, totalPages: 1, hasMore: false },
  isFetchingPaginatedVideo: false,
  fetchPaginatedVideoError: null,
  // Media scan state
  mediaScanPath: '',
  isScanningMedia: false,
  mediaScanError: null,
  loading: false,
  error: null,

  // ADD THESE TRANSCRIPTION INITIAL STATES:
  transcriptionData: null,
  transcriptionSyncData: null,
  isTranscribing: false,
  transcriptionError: null,
});

// --- Actions ---

export const setLoading = (isLoading: boolean) => {
  $spotifyStore.setKey('loading', isLoading);
};

export const setError = (message: string | null) => {
  $spotifyStore.setKey('error', message);
};
// Add this action to clear transcription data
export const clearTranscription = () => {
  const state = $spotifyStore.get();
  $spotifyStore.set({
    ...state,
    transcriptionData: null,
    transcriptionSyncData: null,
    isTranscribing: false,
    transcriptionError: null,
  });
};
/**
 * Resets all playback-related state to their initial non-playing values.
 * This is useful when stopping playback, closing a modal, or clearing the player.
 */
export const resetPlaybackState = () => {
  isPlayingAtom.set(false);
  currentTrackAtom.set(null);
  progressAtom.set(0);
  durationAtom.set(0);
  bufferedAtom.set([]);
  isVideoModalOpenAtom.set(false);
  $spotifyStore.setKey('loading', false);
  $spotifyStore.setKey('error', null);
  clearTranscription(); // Add this line
};

/**
 * Sets the playback state (playing or paused).
 * This is primarily used by the media element's event handlers in SpotifyAppPage
 * to synchronize the store's `isPlaying` state with the actual media element.
 */
export const setPlaying = (status: boolean) => {
  isPlayingAtom.set(status);
};

/**
 * Sets the current playback progress in seconds.
 */
export const setTrackProgress = (progress: number) => {
  progressAtom.set(progress);
};

/**
 * Sets the total duration of the current track in seconds.
 */
export const setTrackDuration = (duration: number) => {
  durationAtom.set(duration);
};

/**
 * Sets the visibility of the video modal.
 */
export const setIsVideoModalOpen = (isOpen: boolean) => {
  isVideoModalOpenAtom.set(isOpen);
};

/**
 * Sets the current buffered ranges.
 */
export const setBuffered = (ranges: BufferedRange[]) => {
  bufferedAtom.set(ranges);
};

/**
 * Plays a specific track and optionally sets up a new queue/history.
 * @param mediaFile The MediaFileResponseDto to play.
 * @param contextTracks All tracks available in the current context (e.g., playlist, album, search results).
 */
export const playTrack = (
  mediaFile: MediaFileResponseDto,
  contextTracks: Track[],
) => {
  const trackToPlay = mapMediaFileToTrack(mediaFile);
  // Get values from individual atoms
  const currentTrack = currentTrackAtom.get();
  const isPlaying = isPlayingAtom.get();
  const shuffle = shuffleAtom.get(); // Get shuffle from persistent atom

  // If playing the same track, just toggle play/pause
  if (currentTrack?.id === trackToPlay.id) {
    isPlayingAtom.set(!isPlaying);
    return;
  }

  // Add current track to history before changing
  if (currentTrack) {
    $spotifyStore.setKey('history', [
      ...$spotifyStore.get().history,
      currentTrack,
    ]);
  }

  // Set new current track and build a new queue
  const trackIndex = contextTracks.findIndex((t) => t.id === trackToPlay.id);
  let newQueue: Track[] = [];
  if (trackIndex !== -1) {
    newQueue = contextTracks.slice(trackIndex + 1);
    if (shuffle) {
      newQueue = shuffleArray(newQueue);
    }
  }

  // Update individual atoms and map
  currentTrackAtom.set(trackToPlay);
  isPlayingAtom.set(true); // Intend to play immediately
  progressAtom.set(0); // Reset progress for new track
  durationAtom.set(trackToPlay.duration || 0); // Set initial duration
  bufferedAtom.set([]); // New: Reset buffered ranges for new track

  // Set video modal visibility based on track type
  if (trackToPlay.fileType === FileType.VIDEO) {
    isVideoModalOpenAtom.set(true);
  } else {
    isVideoModalOpenAtom.set(false);
  }

  $spotifyStore.set({
    ...$spotifyStore.get(), // Keep other map properties
    queue: newQueue,
    error: null, // Clear any previous errors
    loading: true, // Set loading while media prepares
  });
};

export const togglePlayPause = () => {
  isPlayingAtom.set(!isPlayingAtom.get());
};

export const setVolume = (volume: number) => {
  volumeAtom.set(volume);
};

export const toggleShuffle = () => {
  const state = $spotifyStore.get();
  const newShuffle = !shuffleAtom.get(); // Toggle the persistent atom
  shuffleAtom.set(newShuffle);

  let newQueue = [...state.queue];

  if (newShuffle) {
    newQueue = shuffleArray(newQueue);
  } else {
    // If unshuffling, try to restore original order or just keep current order
    // For simplicity, we'll just keep the current shuffled order if no original order is maintained
    // A more robust solution would require storing the 'unshuffled' queue.
  }
  $spotifyStore.set({ ...state, queue: newQueue });
};

export const toggleRepeat = () => {
  const currentMode = repeatModeAtom.get(); // Get from persistent atom
  const newMode: RepeatMode =
    currentMode === 'off'
      ? 'context'
      : currentMode === 'context'
        ? 'track'
        : 'off';
  repeatModeAtom.set(newMode); // Set the persistent atom
};

export const nextTrack = () => {
  const state = $spotifyStore.get(); // Get map state
  const currentTrack = currentTrackAtom.get(); // Get currentTrack from atom
  const repeatMode = repeatModeAtom.get(); // Get repeatMode from persistent atom

  if (repeatMode === 'track' && currentTrack) {
    // If repeating current track, just restart it
    progressAtom.set(0);
    isPlayingAtom.set(true);
    // Modal state doesn't change if repeating the same track
    return;
  }

  if (state.queue.length > 0) {
    const [next, ...rest] = state.queue;
    if (currentTrack) {
      $spotifyStore.setKey('history', [...state.history, currentTrack]);
    }
    currentTrackAtom.set(next);
    isPlayingAtom.set(true);
    progressAtom.set(0);
    durationAtom.set(next.duration || 0);
    bufferedAtom.set([]); // New: Reset buffered ranges for new track

    // Update video modal state for the next track
    if (next.fileType === FileType.VIDEO) {
      isVideoModalOpenAtom.set(true);
    } else {
      isVideoModalOpenAtom.set(false);
    }

    $spotifyStore.set({
      ...state,
      queue: rest,
    });
  } else if (repeatMode === 'context' && state.currentPlaylist) {
    // If queue is empty but repeating context, restart from the beginning of the current playlist
    const firstTrack = state.currentPlaylist.tracks[0];
    if (firstTrack) {
      currentTrackAtom.set(firstTrack);
      isPlayingAtom.set(true);
      progressAtom.set(0);
      durationAtom.set(firstTrack.duration || 0);
      bufferedAtom.set([]); // New: Reset buffered ranges for new track

      // Update video modal state for the first track in playlist
      if (firstTrack.fileType === FileType.VIDEO) {
        isVideoModalOpenAtom.set(true);
      } else {
        isVideoModalOpenAtom.set(false);
      }

      $spotifyStore.set({
        ...state,
        queue: shuffleArray(state.currentPlaylist.tracks.slice(1)),
        history: [],
      });
    } else {
      // No tracks in playlist, stop playing
      resetPlaybackState(); // New: Use resetPlaybackState
    }
  } else {
    // No more tracks and not repeating, stop playing
    resetPlaybackState(); // New: Use resetPlaybackState
  }
};

export const previousTrack = () => {
  const state = $spotifyStore.get(); // Get map state
  const currentTrack = currentTrackAtom.get(); // Get currentTrack from atom

  if (state.history.length > 0) {
    const previous = state.history[state.history.length - 1];
    const newHistory = state.history.slice(0, -1);
    if (currentTrack) {
      $spotifyStore.setKey('queue', [currentTrack, ...state.queue]);
    }
    currentTrackAtom.set(previous);
    isPlayingAtom.set(true);
    progressAtom.set(0);
    durationAtom.set(previous.duration || 0);
    bufferedAtom.set([]); // New: Reset buffered ranges for new track

    // Update video modal state for the previous track
    if (previous.fileType === FileType.VIDEO) {
      isVideoModalOpenAtom.set(true);
    } else {
      isVideoModalOpenAtom.set(false);
    }

    $spotifyStore.set({
      ...state,
      history: newHistory,
    });
  } else {
    // If no history, restart current track
    if (currentTrack) {
      progressAtom.set(0);
      isPlayingAtom.set(true);
      // Modal state doesn't change if restarting the same track
    } else {
      resetPlaybackState(); // New: Use resetPlaybackState
    }
  }
};

// Helper for shuffling arrays
const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// --- Media File Actions ---

/**
 * Fetches media files based on purpose (general, paginated audio, paginated video).
 * @param query Pagination and filter query.
 * @param purpose The intended use of the fetched data.
 * @param reset If true, clears existing data for the purpose before adding new.
 */
export const fetchMediaForPurpose = async (
  query: PaginationMediaQueryDto = {
    page: 1,
    pageSize: 20,
    fileType: FileType.VIDEO || FileType.AUDIO,
  },
  purpose: 'general' | 'paginatedAudio' | 'paginatedVideo',
  reset: boolean = false,
) => {
  const state = $spotifyStore.get();
  let currentFiles: MediaFileResponseDto[] = [];
  let currentPagination = {
    page: 1,
    pageSize: 20,
    totalPages: 1,
    hasMore: false,
  };

  // Set loading and error states based on purpose
  switch (purpose) {
    case 'general':
      $spotifyStore.setKey('isFetchingMedia', true);
      $spotifyStore.setKey('fetchMediaError', null); // Clear any existing error before fetching
      currentFiles = state.allAvailableMediaFiles;

      break;
    case 'paginatedAudio':
      $spotifyStore.setKey('isFetchingPaginatedAudio', true);
      $spotifyStore.setKey('fetchPaginatedAudioError', null);
      currentFiles = state.paginatedAudioFiles;
      currentPagination = state.audioPagination;
      break;
    case 'paginatedVideo':
      $spotifyStore.setKey('isFetchingPaginatedVideo', true);
      $spotifyStore.setKey('fetchPaginatedVideoError', null);
      currentFiles = state.paginatedVideoFiles;
      currentPagination = state.videoPagination;
      break;
  }

  try {
    // Ensure page and pageSize are set for paginated purposes
    const effectiveQuery = { ...query };
    // If resetting, ensure page is 1. Otherwise, use current pagination page or query page.
    if (reset) {
      effectiveQuery.page = 1;
    } else if (!effectiveQuery.page) {
      effectiveQuery.page = currentPagination.page;
    } else if (effectiveQuery.page < currentPagination.page) {
      // If fetching a page less than current, it implies a reset to an earlier page
      reset = true;
    }
    if (!effectiveQuery.pageSize)
      effectiveQuery.pageSize = currentPagination.pageSize;

    const result = await apiFetchAllMediaFiles(effectiveQuery);
    console.log(result, effectiveQuery);
    const newItems = result.items.filter(
      (newItem) =>
        !currentFiles.some((existingItem) => existingItem.id === newItem.id),
    );

    const updatedFiles = reset ? newItems : [...currentFiles, ...newItems];

    const newPagination = {
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      hasMore: result.page < result.totalPages,
    };

    // Update store keys based on purpose
    switch (purpose) {
      case 'general':
        $spotifyStore.setKey('allAvailableMediaFiles', updatedFiles);
        // If no media files were found, set the fetchMediaError
        if (updatedFiles.length === 0) {
          $spotifyStore.setKey('fetchMediaError', 'No Media files found');
        }
        break;
      case 'paginatedAudio':
        $spotifyStore.setKey('paginatedAudioFiles', updatedFiles);
        $spotifyStore.setKey('audioPagination', newPagination);
        break;
      case 'paginatedVideo':
        $spotifyStore.setKey('paginatedVideoFiles', updatedFiles);
        $spotifyStore.setKey('videoPagination', newPagination);
        break;
    }
  } catch (error: any) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load media files.';
    showGlobalSnackbar(`Error loading media files: ${errorMessage}`, 'error');
    switch (purpose) {
      case 'general':
        $spotifyStore.setKey('fetchMediaError', errorMessage);
        break;
      case 'paginatedAudio':
        $spotifyStore.setKey('fetchPaginatedAudioError', errorMessage);
        break;
      case 'paginatedVideo':
        $spotifyStore.setKey('fetchPaginatedVideoError', errorMessage);
        break;
    }
  } finally {
    switch (purpose) {
      case 'general':
        $spotifyStore.setKey('isFetchingMedia', false);
        break;
      case 'paginatedAudio':
        $spotifyStore.setKey('isFetchingPaginatedAudio', false);
        break;
      case 'paginatedVideo':
        $spotifyStore.setKey('isFetchingPaginatedVideo', false);
        break;
    }
  }
};

export const addExtractedMediaFile = (mediaFile: MediaFileResponseDto) => {
  const currentFiles = $spotifyStore.get().allAvailableMediaFiles;
  // Check if the file already exists to prevent duplicates
  if (!currentFiles.some((file) => file.id === mediaFile.id)) {
    $spotifyStore.setKey('allAvailableMediaFiles', [
      ...currentFiles,
      mediaFile,
    ]);
  }
};

export const fetchUserPlaylists = async (
  query?: PaginationPlaylistQueryDto,
) => {
  $spotifyStore.setKey('isLoadingPlaylists', true);
  $spotifyStore.setKey('playlistError', null);
  try {
    const result = await fetchPlaylists(query);

    const transformedPlaylists: Playlist[] = result.items.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      isPublic: p.isPublic,
      cover:
        p.playlistMediaFiles?.[0]?.file?.metadata?.data?.thumbnail ||
        (p.playlistMediaFiles?.[0]?.file?.fileType === FileType.VIDEO
          ? '/default-video-cover.png'
          : '/default-album-art.png'), // Dynamic default cover
      tracks: p.playlistMediaFiles
        .filter((pt) => pt.file) // Ensure file exists before mapping
        .map((pt) => mapMediaFileToTrack(pt.file)),
      trackCount: p.trackCount || p.playlistMediaFiles.length,
    }));
    $spotifyStore.setKey('playlists', transformedPlaylists);
  } catch (error: any) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load playlists.';
    showGlobalSnackbar(`Error loading playlists: ${errorMessage}`, 'error');
  } finally {
    $spotifyStore.setKey('isLoadingPlaylists', false);
  }
};

export const loadPlaylistDetails = async (playlistId: string) => {
  $spotifyStore.setKey('isLoadingPlaylists', true);
  $spotifyStore.setKey('playlistError', null);
  try {
    const p = await fetchPlaylistById(playlistId);
    const transformedPlaylist: Playlist = {
      id: p.id,
      name: p.name,
      description: p.description,
      isPublic: p.isPublic,
      cover:
        p.playlistMediaFiles?.[0]?.file?.metadata?.data?.thumbnail ||
        (p.playlistMediaFiles?.[0]?.file?.fileType === FileType.VIDEO
          ? '/default-video-cover.png'
          : '/default-album-art.png'), // Dynamic default cover
      tracks: p.playlistMediaFiles
        .filter((pt) => pt.file) // Ensure file exists before mapping
        .map((pt) => mapMediaFileToTrack(pt.file)),
      trackCount: p.trackCount || p.playlistMediaFiles.length,
    };
    $spotifyStore.setKey('currentPlaylist', transformedPlaylist);
  } catch (error: any) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to load playlist details.';
    $spotifyStore.setKey('playlistError', errorMessage);
    showGlobalSnackbar(
      `Error loading playlist details: ${errorMessage}`,
      'error',
    );
  } finally {
    $spotifyStore.setKey('isLoadingPlaylists', false);
  }
};

/**
 * Creates a new playlist. This action accepts a frontend-friendly DTO.
 */
export const createUserPlaylist = async (payload: PlaylistCreationRequest) => {
  try {
    const newPlaylist = await apiCreatePlaylist(payload);
    showGlobalSnackbar(
      `Playlist ${newPlaylist.name} created successfully!`,
      'success',
    );
    fetchUserPlaylists();
    return newPlaylist;
  } catch (error: any) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create playlist.';
    showGlobalSnackbar(`Error creating playlist: ${errorMessage}`, 'error');
    throw error;
  }
};

export const updateExistingPlaylist = async (
  playlistId: string,
  dto: UpdatePlaylistDto,
) => {
  try {
    const updatedPlaylist = await updatePlaylist(playlistId, dto);
    showGlobalSnackbar(
      `Playlist ${updatedPlaylist.name} updated successfully!`,
      'success',
    );
    fetchUserPlaylists();
    if ($spotifyStore.get().currentPlaylist?.id === playlistId) {
      // Check currentPlaylist from store map
      loadPlaylistDetails(playlistId);
    }
    return updatedPlaylist;
  } catch (error: any) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update playlist.';
    showGlobalSnackbar(`Error updating playlist: ${errorMessage}`, 'error');
    throw error;
  }
};

export const removePlaylist = async (playlistId: string) => {
  try {
    await deletePlaylist(playlistId);
    showGlobalSnackbar('Playlist deleted successfully!', 'success');
    fetchUserPlaylists();
    // If the current track was part of the deleted playlist, reset playback state
    const currentTrack = currentTrackAtom.get();
    if (currentTrack && currentTrack.id === playlistId) {
      // Assuming playlist ID could be used as a track ID in some contexts, though unlikely
      resetPlaybackState();
    }
    // More robust check: if currentTrack is from a playlist, check if that playlist is the deleted one
    // This would require currentTrack to store its origin playlist ID, which it currently doesn't.
    // For simplicity, we just clear if the currentTrack ID matches the playlistId.
  } catch (error: any) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete playlist.';
    showGlobalSnackbar(`Error deleting playlist: ${errorMessage}`, 'error');
    throw error;
  }
};

export const addMediaToSpecificPlaylist = async (
  playlistId: string,
  dto: AddRemoveMediaToPlaylistDto,
) => {
  try {
    await addMediaToPlaylist(playlistId, dto);
    showGlobalSnackbar('Media added to playlist successfully!', 'success');
    loadPlaylistDetails(playlistId);
    fetchUserPlaylists(); // Re-fetch all playlists to update counts/content in library
  } catch (error: any) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to add media to playlist.';
    showGlobalSnackbar(`Error adding media: ${errorMessage}`, 'error');
    throw error;
  }
};

export const removeMediaFromSpecificPlaylist = async (
  playlistId: string,
  mediaFileId: string,
) => {
  try {
    await removeMediaFromPlaylist(playlistId, { mediaFileId });
    showGlobalSnackbar('Media removed from playlist successfully!', 'success');
    loadPlaylistDetails(playlistId);
    fetchUserPlaylists(); // Re-fetch all playlists to update counts/content in library
  } catch (error: any) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to remove media from playlist.';
    showGlobalSnackbar(`Error removing media: ${errorMessage}`, 'error');
    throw error;
  }
};

// =========================================================================
// Media Scanning Actions
// =========================================================================
export const setMediaScanPath = (path: string) => {
  $spotifyStore.setKey('mediaScanPath', path);
};

export const triggerMediaScan = async (path: string) => {
  const isLoggedIn = authStore.get().isLoggedIn;
  if (!isLoggedIn) {
    showGlobalSnackbar('You must be logged in to scan media.', 'error');
    return;
  }

  const state = $spotifyStore.get();
  if (state.isScanningMedia) return;

  $spotifyStore.set({ ...state, isScanningMedia: true, mediaScanError: null });

  try {
    // Call the API to scan media directory
    await apiScanMediaDirectory({ directoryPath: path });

    showGlobalSnackbar(`Scanning directory: ${path}`, 'info');

    // After scan, re-fetch all media and paginated media to reflect changes
    fetchMediaForPurpose({ page: 1, pageSize: 200 }, 'general', true);
    fetchMediaForPurpose(
      { page: 1, pageSize: 20, fileType: FileType.AUDIO },
      'paginatedAudio',
      true,
    );
    fetchMediaForPurpose(
      { page: 1, pageSize: 20, fileType: FileType.VIDEO },
      'paginatedVideo',
      true,
    );

    showGlobalSnackbar('Media scan complete!', 'success');
  } catch (err: any) {
    const message = err.message || 'Failed to trigger media scan.';
    $spotifyStore.setKey('mediaScanError', message);
    showGlobalSnackbar(message, 'error');
  } finally {
    $spotifyStore.setKey('isScanningMedia', false);
  }
};

export const loadTranscription = async (fileId: string) => {
  const state = $spotifyStore.get();
  $spotifyStore.setKey('isTranscribing', true);
  $spotifyStore.setKey('transcriptionError', null);

  try {
    const data = await getTranscription(fileId);
    $spotifyStore.set({
      ...state,
      transcriptionData: data,
      isTranscribing: false,
      transcriptionError: null,
    });
  } catch (err) {
    $spotifyStore.set({
      ...state,
      isTranscribing: false,
      transcriptionError:
        err instanceof Error ? err.message : 'Failed to load transcription',
    });
  } finally {
    $spotifyStore.setKey('isTranscribing', false);
  }
};

export const transcribeAudioAction = async (fileId: string) => {
  const state = $spotifyStore.get();
  $spotifyStore.setKey('isTranscribing', true);
  $spotifyStore.setKey('transcriptionError', null);

  try {
    const data = await transcribeAudio(fileId);
    $spotifyStore.set({
      ...state,
      transcriptionData: data,
      isTranscribing: false,
      transcriptionError: null,
    });
  } catch (err) {
    $spotifyStore.set({
      ...state,
      isTranscribing: false,
      transcriptionError:
        err instanceof Error ? err.message : 'Transcription failed',
    });
  } finally {
    $spotifyStore.setKey('isTranscribing', false);
  }
};

export const updateTranscriptionSync = async (
  fileId: string,
  currentTime: number,
) => {
  const state = $spotifyStore.get();
  if (!state.transcriptionData) return;

  try {
    const syncData = await getSyncTranscription(fileId, currentTime);
    $spotifyStore.setKey('transcriptionSyncData', syncData);
  } catch (err) {
    console.error('Failed to sync transcription:', err);
  }
};
