import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  useTheme,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import { useStore } from '@nanostores/react';
import {
  $spotifyStore,
  addMediaToSpecificPlaylist,
} from '@/stores/spotifyStore'; // Updated import
import { MediaFileResponseDto, Playlist } from '@/types';

interface AddMediaToPlaylistDialogProps {
  open: boolean;
  onClose: () => void;
  mediaFile: MediaFileResponseDto | null;
  onShowSnackbar: (
    message: string,
    severity: 'success' | 'error' | 'info',
  ) => void;
  isLoggedIn: boolean;
}

const AddMediaToPlaylistDialog: React.FC<AddMediaToPlaylistDialogProps> = ({
  open,
  onClose,
  mediaFile,
  onShowSnackbar,
  isLoggedIn,
}) => {
  const theme = useTheme();
  const { playlists, isLoadingPlaylists } = useStore($spotifyStore); // Removed isAddingMediaToPlaylist and addError from store as they are handled locally
  const [searchTerm, setSearchTerm] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false); // Local loading state for adding media

  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setAddError(null);
      setIsAdding(false); // Reset local loading state
    }
  }, [open]);

  const filteredPlaylists = useMemo(() => {
    if (!playlists) return [];
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return playlists.filter((playlist) =>
      playlist.name.toLowerCase().includes(lowerCaseSearchTerm),
    );
  }, [playlists, searchTerm]);

  const handleAddMediaToPlaylist = useCallback(
    async (playlist: Playlist) => {
      if (!isLoggedIn) {
        onShowSnackbar(
          'You must be logged in to add media to a playlist.',
          'error',
        );
        return;
      }
      if (!mediaFile) {
        setAddError('No media file selected.');
        return;
      }

      setAddError(null);
      setIsAdding(true); // Set local loading state

      try {
        // Call the correct action
        await addMediaToSpecificPlaylist(playlist.id, {
          mediaFileId: mediaFile.id,
        });
        onShowSnackbar(
          `'${mediaFile.name}' added to playlist '${playlist.name}'!`,
          'success',
        );
        onClose();
      } catch (err: any) {
        const message = err.message || 'Failed to add media to playlist.';
        setAddError(message);
        onShowSnackbar(`Failed to add: ${message}`, 'error');
      } finally {
        setIsAdding(false); // Reset local loading state
      }
    },
    [isLoggedIn, mediaFile, onShowSnackbar, onClose],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pr: 1,
        }}
      >
        <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
          Add "{mediaFile?.name || 'Media'}" to Playlist
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: theme.palette.text.secondary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        {addError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {addError}
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          id="search-playlist"
          label="Search Playlists"
          type="text"
          fullWidth
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            style: { color: theme.palette.text.primary },
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: theme.palette.text.secondary }} />
              </InputAdornment>
            ),
          }}
        />

        {isLoadingPlaylists ? (
          <Box className="flex justify-center items-center h-24">
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Loading playlists...
            </Typography>
          </Box>
        ) : filteredPlaylists.length === 0 ? (
          <Alert severity="info">
            No playlists found or matching your search.
          </Alert>
        ) : (
          <List sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {filteredPlaylists.map((playlist) => (
              <ListItem
                key={playlist.id}
                secondaryAction={
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={
                      isAdding ? (
                        <CircularProgress size={16} />
                      ) : (
                        <PlaylistAddIcon />
                      )
                    }
                    onClick={() => handleAddMediaToPlaylist(playlist)}
                    disabled={isAdding}
                  >
                    Add
                  </Button>
                }
                sx={{
                  bgcolor: theme.palette.background.default,
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': { bgcolor: theme.palette.action.hover },
                }}
              >
                <ListItemText
                  primary={playlist.name}
                  secondary={`${playlist.trackCount} tracks`}
                  primaryTypographyProps={{ fontWeight: 'bold' }}
                  secondaryTypographyProps={{ color: 'text.secondary' }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          p: 2,
          justifyContent: 'flex-end',
        }}
      >
        <Button onClick={onClose} disabled={isAdding}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddMediaToPlaylistDialog;
