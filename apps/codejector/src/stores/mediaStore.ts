import { map, atom } from 'nanostores';
import { showGlobalSnackbar } from './aiEditorStore';
import { persistentAtom, mapMediaFileToTrack } from '@/utils';
import {
  Track,
  Playlist,
  PaginationPlaylistQueryDto,
  UpdatePlaylistDto,
  AddRemoveMediaToPlaylistDto,
  MediaFileResponseDto,
  MediaFileResponseDtoUrl,
  RepeatMode,
  PlaylistCreationRequest,
  PaginationMediaQueryDto,
  FileType,
  BufferedRange,
  PaginationMediaResultDto,
  TranscriptionResult,
  SyncTranscriptionResponse,
} from '@/types/refactored/media';
import {
  fetchPlaylists,
  fetchPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addMediaToPlaylist,
  removeMediaFromPlaylist,
} from '@/api/playlist';
import {
  scanMediaDirectory,
  fetchMediaFiles,
  transcribeAudio,
  getTranscription,
  getSyncTranscription,
  getFileStreamUrl,
} from '@/api/media';
import { authStore } from './authStore'; // Import authStore for login check

// --- Atoms (Non-persistent for transient playback state, persistent for user preferences) ---
// Playback state should NOT be persistent to avoid browser autoplay issues on refresh.
// However, the user explicitly requested these to be persistent.
export const isPlayingAtom = persistentAtom<boolean>('media:isPlaying', false);
export const currentTrackAtom = persistentAtom<MediaFileResponseDtoUrl | null>(
  'media:currentTrack',
  null,
);
export const progressAtom = persistentAtom<number>('media:progress', 0);
export const durationAtom = persistentAtom<number>('media:duration', 0);
export const bufferedAtom = persistentAtom<BufferedRange[]>(
  'media:buffered',
  [],
);
export const isVideoModalOpenAtom = persistentAtom<boolean>(
  'media:isVideoModalOpen',
  false,
);

// User preferences are persistent
export const volumeAtom = persistentAtom<number>('media:volume', 70); // Persistent
export const repeatModeAtom = persistentAtom<RepeatMode>(
  'media:repeatMode',
  'off',
); // Persistent
export const shuffleAtom = persistentAtom<boolean>('media:shuffle', false); // Persistent
export const showTranscriptionAtom = persistentAtom<boolean>(
  'media:showTranscription',
  false,
); // Persistent: Toggles transcription display

// Transcription data (non-persistent, specific to current track)
export const transcriptionResultAtom = atom<TranscriptionResult | null>(null);
export const transcriptionSyncDataAtom = atom<SyncTranscriptionResponse | null>(
  null,
);
export const isTranscribingAtom = persistentAtom<boolean>(
  'media:isTranscribing',
  false,
);
export const transcriptionErrorAtom = persistentAtom<string | null>(
  'media:transcriptionError',
  null,
);

// --- Map Store (Non-persistent for shared playback state) ---
export const $mediaStore = map({
  isFetchingMedia: false, // Renamed from 'loading'
  fetchMediaError: null as string | null, // Renamed from 'error'
  currentPlaylist: null as Playlist | null,
  playlists: [] as Playlist[],
  allAvailableMediaFiles: [] as MediaFileResponseDto[],
  mediaElement: null as HTMLMediaElement | null, // Added to store direct media element reference
});

// --- Global Actions (Stateless logic) ---

/**
 * Registers the actual HTMLMediaElement (audio/video) with the store.
 * This allows store actions to directly control playback.
 */
export const setMediaElement = (element: HTMLMediaElement | null) => {
  $mediaStore.setKey('mediaElement', element);
};

/**
 * Resets playback state to initial values.  Useful when unmounting media players or logging out.
 */
export function resetPlaybackState() {
  isPlayingAtom.set(false);
  currentTrackAtom.set(null);
  progressAtom.set(0);
  durationAtom.set(0);
  bufferedAtom.set([]);
  isVideoModalOpenAtom.set(false);
  clearTranscriptionData(); // Also clear transcription state
  // Do not reset mediaElement here, it's managed by the component owning it.
  // It's cleared by `setMediaElement(null)` in the component's unmount effect.
}

export const setLoading = (isLoading: boolean) => {
  $mediaStore.setKey('isFetchingMedia', isLoading);
};

export const setError = (message: string | null) => {
  $mediaStore.setKey('fetchMediaError', message);
};

export const setPlaying = (isPlaying: boolean) => {
  isPlayingAtom.set(isPlaying);
  // Direct control of mediaElement.play()/pause() moved to MediaPlayerContainer
  // to better manage when playback is initiated (e.g., after 'canplay' event)
};

export const setTrackProgress = (progress: number) => {
  progressAtom.set(progress);
};

export const setTrackDuration = (duration: number) => {
  durationAtom.set(duration);
};

export const setBuffered = (buffered: BufferedRange[]) => {
  bufferedAtom.set(buffered);
};

export const setVolume = (volume: number) => {
  volumeAtom.set(volume);
  const mediaElement = $mediaStore.get().mediaElement;
  if (mediaElement) {
    mediaElement.volume = volume / 100;
  }
};

export const setIsVideoModalOpen = (isOpen: boolean) => {
  isVideoModalOpenAtom.set(isOpen);
};

// Implement toggleShuffle and toggleRepeat actions, using the atoms directly
export const toggleShuffle = () => {
  shuffleAtom.set(!shuffleAtom.get());
};

export const toggleRepeat = () => {
  const currentMode = repeatModeAtom.get();
  let newMode: RepeatMode = 'off';

  switch (currentMode) {
    case 'off':
      newMode = 'context';
      break;
    case 'context':
      newMode = 'track';
      break;
    case 'track':
      newMode = 'off';
      break;
  }

  repeatModeAtom.set(newMode);
};

export const toggleShowTranscription = () => {
  showTranscriptionAtom.set(!showTranscriptionAtom.get());
};

export const clearTranscriptionData = () => {
  transcriptionResultAtom.set(null);
  transcriptionSyncDataAtom.set(null);
  isTranscribingAtom.set(false);
  transcriptionErrorAtom.set(null);
};

export const fetchAndLoadTranscription = async (fileId: string) => {
  if (!fileId) return;
  isTranscribingAtom.set(true);
  transcriptionErrorAtom.set(null);
  let result: TranscriptionResult;
  try {
    const transcriptionMetadata = currentTrackAtom
      .get()
      .metadata.find((m) => m.type === FileType.TRANSCRIPT);
    if (transcriptionMetadata && transcriptionMetadata.data) {
      result = transcriptionMetadata.data;
    } else {
      result = await getTranscription(fileId);
    }

    transcriptionResultAtom.set(result);
    //showGlobalSnackbar('Transcription loaded successfully', 'success'); // Add snackbar on success
    updateCurrentTranscriptionSync(fileId, progressAtom.get());
  } catch (err: any) {
    console.error('Error fetching transcription:', err);
    transcriptionErrorAtom.set(
      `Failed to load transcription: ${err.message || 'Unknown error'} `,
    );
  } finally {
    isTranscribingAtom.set(false);
  }
};

export const transcribeCurrentAudio = async (fileId: string) => {
  if (!fileId) return;
  isTranscribingAtom.set(true);
  transcriptionErrorAtom.set(null);
  try {
    showGlobalSnackbar('Starting transcription...', 'info');
    const result = await transcribeAudio(fileId);
    transcriptionResultAtom.set(result);
    showGlobalSnackbar('Audio transcribed successfully!', 'success');
    // After transcribing, also update sync data to show first segment
    if ($mediaStore.get().mediaElement) {
      updateCurrentTranscriptionSync(
        fileId,
        $mediaStore.get().mediaElement!.currentTime,
      );
    }
  } catch (err: any) {
    console.error('Error transcribing audio:', err);
    transcriptionErrorAtom.set(
      `Failed to transcribe audio: ${err.message || 'Unknown error'} `,
    );
  } finally {
    isTranscribingAtom.set(false);
  }
};

export const updateCurrentTranscriptionSync = async (
  fileId: string,
  currentTime: number,
) => {
  if (!fileId || !transcriptionResultAtom.get()?.segments?.length) {
    // Only sync if transcription exists and has segments
    return;
  }

  try {
    const result = await getSyncTranscription(fileId, currentTime);
    transcriptionSyncDataAtom.set(result);
  } catch (err: any) {
    // Often occurs if transcription is not yet complete on backend or network issues
    console.warn(
      'Could not sync transcription, may not be available yet or API error:',
      err,
    );
    // transcriptionErrorAtom.set("Failed to sync transcription"); // Avoid constant error toasts
  }
};

export const setCurrentTrack = (track: MediaFileResponseDto | null) => {
  // Clear all transcription data at the very beginning when a new track is set
  clearTranscriptionData();

  const newTrack: MediaFileResponseDtoUrl | null = track
    ? {
        ...track,
        streamUrl: getFileStreamUrl(track.path),
      }
    : null;
  currentTrackAtom.set(newTrack);
  progressAtom.set(0); // Reset progress for new track
  durationAtom.set(0); // Reset duration for new track
  setBuffered([]); // Clear buffered ranges for new track

  // Check if transcription data exists in metadata and pre-load it
  if (newTrack && newTrack.metadata) {
    const transcriptionMetadata = newTrack.metadata.find(
      (m) => m.type === FileType.TRANSCRIPT,
    );
    if (transcriptionMetadata && transcriptionMetadata.data) {
      // The 'data' field of TRANSCRIPT metadata is expected to be a TranscriptionResult
      transcriptionResultAtom.set(
        transcriptionMetadata.data as TranscriptionResult,
      );
      showGlobalSnackbar('Transcription pre-loaded from metadata', 'info');
    }
  }

  // Open VideoModal if the new track is a video
  if (newTrack?.fileType === FileType.VIDEO) {
    setIsVideoModalOpen(true);
  } else {
    setIsVideoModalOpen(false);
  }

  setPlaying(true); // Attempt to play new track automatically
};

export const clearError = () => {
  $mediaStore.setKey('fetchMediaError', null);
};

export const nextTrack = async () => {
  let allAvailableMediaFiles = $mediaStore.get().allAvailableMediaFiles;
  const currentTrack = currentTrackAtom.get();

  // If media files are not loaded in the store, attempt to fetch them.
  if (allAvailableMediaFiles.length === 0) {
    showGlobalSnackbar('Fetching available media files...', 'info');
    await fetchingMediaFiles(); // This will update $mediaStore
    allAvailableMediaFiles = $mediaStore.get().allAvailableMediaFiles; // Re-fetch from store
    if (allAvailableMediaFiles.length === 0) {
      showGlobalSnackbar('No tracks available to play after fetching.', 'info');
      return;
    }
  }

  // Determine the next track logic
  let nextMediaFile: MediaFileResponseDto | undefined;
  const shuffle = shuffleAtom.get();

  if (shuffle) {
    const randomIndex = Math.floor(
      Math.random() * allAvailableMediaFiles.length,
    );
    nextMediaFile = allAvailableMediaFiles[randomIndex];
  } else {
    let currentIndex = -1;
    if (currentTrack) {
      currentIndex = allAvailableMediaFiles.findIndex(
        (track) => track.id === currentTrack.id,
      );
    }

    if (currentIndex === -1) {
      // If no current track or current track not found, play the first available
      if (allAvailableMediaFiles.length > 0) {
        nextMediaFile = allAvailableMediaFiles[0];
        if (currentTrack) {
          showGlobalSnackbar(
            'Current track not found in list, playing first available.',
            'warning',
          );
        }
      }
    } else {
      // Normal next track logic
      const nextIndex = (currentIndex + 1) % allAvailableMediaFiles.length;
      nextMediaFile = allAvailableMediaFiles[nextIndex];
    }
  }

  if (nextMediaFile) {
    setCurrentTrack(nextMediaFile);
  } else {
    showGlobalSnackbar('No tracks available to play.', 'info');
    setPlaying(false); // Ensure player is paused if no track is available
  }
};

export const previousTrack = async () => {
  let allAvailableMediaFiles = $mediaStore.get().allAvailableMediaFiles;
  const currentTrack = currentTrackAtom.get();

  // If media files are not loaded in the store, attempt to fetch them.
  if (allAvailableMediaFiles.length === 0) {
    showGlobalSnackbar('Fetching available media files...', 'info');
    await fetchingMediaFiles(); // This will update $mediaStore
    allAvailableMediaFiles = $mediaStore.get().allAvailableMediaFiles; // Re-fetch from store
    if (allAvailableMediaFiles.length === 0) {
      showGlobalSnackbar('No tracks available to play after fetching.', 'info');
      return;
    }
  }

  // Determine the previous track logic
  let previousMediaFile: MediaFileResponseDto | undefined;
  const shuffle = shuffleAtom.get();

  if (shuffle) {
    const randomIndex = Math.floor(
      Math.random() * allAvailableMediaFiles.length,
    );
    previousMediaFile = allAvailableMediaFiles[randomIndex];
  } else {
    let currentIndex = -1;
    if (currentTrack) {
      currentIndex = allAvailableMediaFiles.findIndex(
        (track) => track.id === currentTrack.id,
      );
    }

    if (currentIndex === -1) {
      // If no current track or current track not found, play the last available
      if (allAvailableMediaFiles.length > 0) {
        previousMediaFile =
          allAvailableMediaFiles[allAvailableMediaFiles.length - 1];
        if (currentTrack) {
          showGlobalSnackbar(
            'Current track not found in list, playing last available.',
            'warning',
          );
        }
      }
    } else {
      // Normal previous track logic
      const previousIndex =
        (currentIndex - 1 + allAvailableMediaFiles.length) %
        allAvailableMediaFiles.length;
      previousMediaFile = allAvailableMediaFiles[previousIndex];
    }
  }

  if (previousMediaFile) {
    setCurrentTrack(previousMediaFile);
  } else {
    showGlobalSnackbar('No tracks available to play.', 'info');
    setPlaying(false); // Ensure player is paused if no track is available
  }
};

export const addMediaToPlaylistAction = async (
  playlistId: string,
  mediaFileId: string,
) => {
  try {
    await addMediaToPlaylist({ playlistId, mediaFileId });
    showGlobalSnackbar('Media Added to Playlist', 'success');
  } catch (error: any) {
    showGlobalSnackbar(error.message, 'error');
  }
};

export const removeMediaFromPlaylistAction = async (
  playlistId: string,
  mediaFileId: string,
) => {
  try {
    await removeMediaFromPlaylist({ playlistId, mediaFileId });
    showGlobalSnackbar('Media Removed from Playlist', 'success');
  } catch (error: any) {
    showGlobalSnackbar(error.message, 'error');
  }
};

export const fetchPlaylistsAction = async (
  query?: PaginationPlaylistQueryDto,
) => {
  try {
    return await fetchPlaylists(query);
  } catch (error: any) {
    showGlobalSnackbar(error.message, 'error');
  }
};

export const fetchPlaylistByIdAction = async (id: string) => {
  try {
    return await fetchPlaylistById(id);
  } catch (error: any) {
    showGlobalSnackbar(error.message, 'error');
  }
};

export const createPlaylistAction = async (data: PlaylistCreationRequest) => {
  try {
    return await createPlaylist(data);
  } catch (error: any) {
    showGlobalSnackbar(error.message, 'error');
  }
};

export const updatePlaylistAction = async (
  id: string,
  data: UpdatePlaylistDto,
) => {
  try {
    return await updatePlaylist(id, data);
  } catch (error: any) {
    showGlobalSnackbar(error.message, 'error');
  }
};

export const deletePlaylistAction = async (id: string) => {
  try {
    return await deletePlaylist(id);
  } catch (error: any) {
    showGlobalSnackbar(error.message, 'error');
  }
};

export const fetchingMediaFiles = async (
  query?: PaginationMediaQueryDto,
): Promise<PaginationMediaResultDto | null> => {
  $mediaStore.setKey('isFetchingMedia', true);
  $mediaStore.setKey('fetchMediaError', null);

  let audioResult: PaginationMediaResultDto | null = null;
  let videoResult: PaginationMediaResultDto | null = null;

  // Apply default pagination and merge any provided query parameters
  const commonQuery: PaginationMediaQueryDto = {
    page: 1,
    pageSize: 100,
    ...query,
  };

  try {
    // Fetch AUDIO files
    const audioQuery: PaginationMediaQueryDto = {
      ...commonQuery,
      fileType: [FileType.AUDIO],
    };
    audioResult = await fetchMediaFiles(audioQuery);
  } catch (err: any) {
    console.error('Error fetching audio files:', err);
    showGlobalSnackbar(
      `Failed to fetch audio files: ${err.message || 'Unknown error'}`,
      'error',
    );
  }

  try {
    // Fetch VIDEO files
    const videoQuery: PaginationMediaQueryDto = {
      ...commonQuery,
      fileType: [FileType.VIDEO],
    };
    videoResult = await fetchMediaFiles(videoQuery);
  } catch (err: any) {
    console.error('Error fetching video files:', err);
    showGlobalSnackbar(
      `Failed to fetch video files: ${err.message || 'Unknown error'}`,
      'error',
    );
  }

  $mediaStore.setKey('isFetchingMedia', false);

  const combinedItems: MediaFileResponseDto[] = [
    ...(audioResult?.items || []),
    ...(videoResult?.items || []),
  ];
  const combinedTotal = (audioResult?.total || 0) + (videoResult?.total || 0);

  if (combinedItems.length > 0) {
    $mediaStore.setKey('allAvailableMediaFiles', combinedItems);
    return {
      items: combinedItems,
      total: combinedTotal,
      page: commonQuery.page || 1,
      pageSize: commonQuery.pageSize || 100,
      totalPages: Math.ceil(combinedTotal / (commonQuery.pageSize || 100)),
    };
  } else {
    const errorMessage = 'No media files (audio or video) available.';
    showGlobalSnackbar(errorMessage, 'warning');
    $mediaStore.setKey('fetchMediaError', errorMessage);
    return null;
  }
};

export type MediaStoreType = typeof $mediaStore;
