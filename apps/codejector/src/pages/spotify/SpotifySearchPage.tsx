import React from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  useTheme,
  CardMedia,
  Alert,
  CardActionArea,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useStore } from '@nanostores/react';
import {
  $spotifyStore,
  playTrack,
  isPlayingAtom,
  currentTrackAtom,
} from '@/stores/spotifyStore';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import AlbumIcon from '@mui/icons-material/Album';
import MovieIcon from '@mui/icons-material/Movie';
import { mapMediaFileToTrack } from '@/utils/mediaUtils';
import { FileType } from '@/types';

interface SpotifySearchPageProps {
  // No specific props for now
}

const SpotifySearchPage: React.FC<SpotifySearchPageProps> = () => {
  const theme = useTheme();
  const { allAvailableMediaFiles } = useStore($spotifyStore);

  // Directly get isPlaying and currentTrack from their respective atoms
  const isPlaying = useStore(isPlayingAtom);
  const currentTrack = useStore(currentTrackAtom);

  const [searchTerm, setSearchTerm] = React.useState('');

  // Filter for all playable media (audio and video)
  const playableMedia = allAvailableMediaFiles.filter(
    (media) =>
      media.fileType === FileType.AUDIO || media.fileType === FileType.VIDEO,
  );

  const filteredTracks = React.useMemo(() => {
    if (!searchTerm) return playableMedia;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return playableMedia.filter(
      (media) =>
        media.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        media.metadata?.data?.title
          ?.toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        media.metadata?.data?.uploader
          ?.toLowerCase()
          .includes(lowerCaseSearchTerm),
    );
  }, [searchTerm, playableMedia]);

  const mockGenres = [
    { id: 1, name: 'Pop', color: '#8d6e63' },
    { id: 2, name: 'Hip Hop', color: '#4a148c' },
    { id: 3, name: 'Rock', color: '#b71c1c' },
    { id: 4, name: 'Jazz', color: '#1b5e20' },
    { id: 5, name: 'Electronic', color: '#006064' },
    { id: 6, name: 'Classical', color: '#311b92' },
    { id: 7, name: 'R&B', color: '#f57f17' },
    { id: 8, name: 'Country', color: '#bf360c' },
    { id: 9, name: 'Indie', color: '#2e7d32' },
    { id: 10, name: 'Metal', color: '#424242' },
    { id: 11, name: 'Blues', color: '#5d4037' },
    { id: 12, name: 'Folk', color: '#880e4f' },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Search
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="What do you want to listen to or watch?"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          sx: {
            borderRadius: '500px',
            bgcolor: theme.palette.background.paper,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'transparent',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
            },
          },
        }}
        sx={{ mb: 4 }}
      />

      {searchTerm ? (
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            Search Results
          </Typography>
          <Grid container spacing={3}>
            {filteredTracks.length > 0 ? (
              filteredTracks.map((mediaFile) => {
                const track = mapMediaFileToTrack(mediaFile);
                const isActive = currentTrack?.id === track.id && isPlaying;
                return (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={2}
                    key={track.id}
                    component="div"
                  >
                    <Card
                      sx={{
                        bgcolor: theme.palette.background.paper,
                        boxShadow: 'none',
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        '&:hover': {
                          bgcolor: theme.palette.action.hover,
                          '& .play-icon-card': {
                            opacity: 1,
                          },
                        },
                        p: 2,
                        position: 'relative',
                        border: isActive
                          ? `2px solid ${theme.palette.primary.main}`
                          : 'none',
                      }}
                    >
                      <CardActionArea
                        onClick={() =>
                          playTrack(
                            mediaFile,
                            playableMedia.map(mapMediaFileToTrack),
                          )
                        }
                      >
                        <Box sx={{ position: 'relative', mb: 1 }}>
                          {track.coverArt ? (
                            <CardMedia
                              component="img"
                              image={track.coverArt}
                              alt={track.title}
                              sx={{
                                width: '100%',
                                borderRadius: 1,
                                aspectRatio:
                                  track.fileType === FileType.VIDEO
                                    ? '16 / 9'
                                    : '1 / 1',
                                objectFit: 'cover',
                              }}
                            />
                          ) : track.fileType === FileType.VIDEO ? (
                            <Box
                              sx={{
                                width: '100%',
                                borderRadius: 1,
                                aspectRatio: '16 / 9',
                                bgcolor:
                                  theme.palette.action.disabledBackground,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}
                            >
                              <MovieIcon
                                sx={{
                                  fontSize: '4rem', // Larger icon
                                  color: theme.palette.text.secondary,
                                }}
                              />
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                width: '100%',
                                borderRadius: 1,
                                aspectRatio: '1 / 1',
                                bgcolor:
                                  theme.palette.action.disabledBackground,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}
                            >
                              <AlbumIcon
                                sx={{
                                  fontSize: '4rem', // Larger icon
                                  color: theme.palette.text.secondary,
                                }}
                              />
                            </Box>
                          )}
                          <PlayCircleFilledWhiteIcon
                            className="play-icon-card"
                            sx={{
                              position: 'absolute',
                              bottom: 8,
                              right: 8,
                              opacity: isActive ? 1 : 0,
                              fontSize: 48,
                              color: theme.palette.primary.main,
                              transition: 'opacity 0.2s',
                            }}
                          />
                        </Box>
                        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 'bold' }}
                          >
                            {track.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {track.artist}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })
            ) : (
              <Box sx={{ p: 2, width: '100%' }}>
                <Alert severity="info">
                  No media found matching "{searchTerm}".
                </Alert>
              </Box>
            )}
          </Grid>
        </Box>
      ) : (
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            Browse all
          </Typography>

          <Grid container spacing={2}>
            {mockGenres.map((genre) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={3}
                lg={2}
                key={genre.id}
                component="div"
              >
                <Card
                  sx={{
                    height: 120,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'flex-end',
                    p: 2,
                    cursor: 'pointer',
                    position: 'relative',
                    bgcolor: genre.color,
                    color: 'white',
                    boxShadow: theme.shadows[3],
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.03)',
                    },
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {genre.name}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default SpotifySearchPage;
