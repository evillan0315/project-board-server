import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import { useStore } from '@nanostores/react';
import {
  $mediaStore,
  setLoading,
  setError,
  setPlaying, // Now directly controls playback via mediaStore
  setCurrentTrack,
  isPlayingAtom,
  currentTrackAtom,
} from '@/stores/mediaStore';

import { fetchMediaFiles } from '@/api/media';
import { MediaFileResponseDto, FileType } from '@/types/refactored/media';
import { mapMediaFileToTrack } from '@/utils/mediaUtils';
import { authStore } from '@/stores/authStore';
import SongList from '@/components/ui/songs/SongList';
import VideoList from '@/components/ui/videos/VideoList';
import { showGlobalSnackbar } from '@/stores/aiEditorStore';
import { API_BASE_URL } from '@/api';
import MediaPlayer from '@/components/ui/MediaPlayer';

interface SpotifyHomePageProps {
  // No specific props for now, just static content
}

const SpotifyHomePage: React.FC<SpotifyHomePageProps> = () => {
  const theme = useTheme();
  const { isLoggedIn } = useStore(authStore); // Get login status
  const {
    loading: isFetchingMedia,
    error: fetchMediaError,
    playlists: storedMediaFiles,
    allAvailableMediaFiles,
  } = useStore($mediaStore);
  const [allAvailableMediaFilesState, setAllAvailableMediaFilesState] =
    useState<MediaFileResponseDto[]>([]);

  // Directly get isPlaying and currentTrack from their respective atoms
  const isPlaying = useStore(isPlayingAtom);
  const currentTrack = useStore(currentTrackAtom);
  // const currentTrack = useStore(currentTrackAtom);
  const [favoriteSongs, setFavoriteSongs] = useState<string[]>([]);
  const [favoriteVideos, setFavoriteVideos] = useState<string[]>([]);
  const [hasFetchedMedia, setHasFetchedMedia] = useState(false);

  const fetchMediaForPurpose = useCallback(async () => {
    if (!isLoggedIn) {
      console.warn('User is not logged in. Skipping media fetch.');
      return;
    }

    setLoading(true);
    try {
      const media = await fetchMediaFiles({ page: 1, pageSize: 200 });
      console.log(media, 'media');
      if (media && media.items) {
        setAllAvailableMediaFilesState(media.items);
        $mediaStore.setKey('allAvailableMediaFiles', media.items);
      }
      setHasFetchedMedia(true);
      setLoading(false);
    } catch (error: any) {
      setError(error.message || error);
      setLoading(false);
      console.error('Error fetching media:', error);
      showGlobalSnackbar(
        `Failed to fetch media: ${error.message || error}`,
        'error',
      );
    }
  }, [isLoggedIn]);

  useEffect(() => {
    // Fetch media files when the component mounts if not already fetched
    // Use 'general' purpose to populate allAvailableMediaFiles, with reset: true
    if (!hasFetchedMedia && !isFetchingMedia) {
      fetchMediaForPurpose();
    }
  }, [fetchMediaForPurpose, hasFetchedMedia, isFetchingMedia]);

  useEffect(() => {
    if (storedMediaFiles) {
      setAllAvailableMediaFilesState(
        storedMediaFiles as MediaFileResponseDto[],
      );
    }
  }, [storedMediaFiles]);

  // Filter for audio files
  const playableAudioTracks: MediaFileResponseDto[] = useMemo(() => allAvailableMediaFilesState.filter(
      (media) => media.fileType === FileType.AUDIO,
    ), [allAvailableMediaFilesState]);

  // Filter for video files
  const playableVideoTracks: MediaFileResponseDto[] = useMemo(() => allAvailableMediaFilesState.filter(
      (media) => media.fileType === FileType.VIDEO,
    ), [allAvailableMediaFilesState]);

  const handlePlayAudio = useCallback((song: MediaFileResponseDto) => {
    setCurrentTrack(song); // Set the track
    setPlaying(true); // Trigger playback via mediaStore (user gesture)
  }, []);

  const handlePlayVideo = useCallback((video: MediaFileResponseDto) => {
    setCurrentTrack(video); // Set the track
    setPlaying(true); // Trigger playback via mediaStore (user gesture)
  }, []);

  const toggleFavoriteSong = useCallback((songId: string) => {
    setFavoriteSongs((prev) =>
      prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId],
    );
  }, []);

  const toggleFavoriteVideo = useCallback((videoId: string) => {
    setFavoriteVideos((prev) =>
      prev.includes(videoId)
        ? prev.filter((id) => id !== videoId)
        : [...prev, videoId],
    );
  }, []);

  const handleSongAction = (action: string, song: MediaFileResponseDto) => {
    showGlobalSnackbar(`Action: ${action} on song ${song.name}`, 'info');
    // Implement other actions like edit, delete, download, etc.
  };

  const handleVideoAction = (action: string, video: MediaFileResponseDto) => {
    showGlobalSnackbar(`Action: ${action} on video ${video.name}`, 'info');
    // Implement other actions like trailer, watchlist, download, etc.l
  };

  const audioList = useMemo(() => playableAudioTracks.map((mediaFile) => {
      const track = mapMediaFileToTrack(mediaFile);
      return {
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        genre: ['Opm', 'Classic'],
        isFavorite: favoriteSongs.includes(track.id),
        thumbnail: track.coverArt,
        year: 2023,
      };
    }), [playableAudioTracks, favoriteSongs]);

  const videoList = useMemo(() => playableVideoTracks.map((mediaFile) => {
      const track = mapMediaFileToTrack(mediaFile);
      return {
        id: track.id,
        title: track.title,
        description: 'description',
        duration: 200,
        thumbnail: track.coverArt,
        genre: ['Action', 'Adventure'],
        isFavorite: favoriteVideos.includes(track.id),
        year: 2013,
        rating: 4.2,
      };
    }), [playableVideoTracks, favoriteVideos]);

  const noPlayableMedia =
    playableAudioTracks.length === 0 && playableVideoTracks.length === 0;

  if (fetchMediaError) {
    return (
      <Alert severity="error">Error loading media: {fetchMediaError}</Alert>
    );
  }

  if (noPlayableMedia) {
    return (
      <Alert severity="info">
        No playable audio or video files found. Upload some via the AI Editor or
        backend.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Good evening
      </Typography>

      <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 4, mb: 2 }}>
        All Available Audio Tracks
      </Typography>
      <SongList
        songs={playableAudioTracks}
        onPlay={handlePlayAudio}
        onFavorite={toggleFavoriteSong}
        onAction={handleSongAction}
      />

      <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 4, mb: 2 }}>
        All Available Video Tracks
      </Typography>
      <VideoList
        videos={playableVideoTracks}
        onPlay={handlePlayVideo}
        onFavorite={toggleFavoriteVideo}
        onAction={handleVideoAction}
      />
    </Box>
  );
};

export default SpotifyHomePage;
