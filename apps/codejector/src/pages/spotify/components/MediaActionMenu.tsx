import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import EditIcon from '@mui/icons-material/Edit';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { MediaFileResponseDto } from '@/types';

interface MediaActionMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  mediaFile: MediaFileResponseDto | null;
  onPlay: (mediaFile: MediaFileResponseDto) => void;
  onAddToPlaylist: (mediaFile: MediaFileResponseDto) => void;
  onUpdate: (mediaFile: MediaFileResponseDto) => void;
  onDownloadMetadata: (mediaFile: MediaFileResponseDto) => void;
  onDelete: (mediaFile: MediaFileResponseDto) => void;
}

const MediaActionMenu: React.FC<MediaActionMenuProps> = ({
  anchorEl,
  open,
  onClose,
  mediaFile,
  onPlay,
  onAddToPlaylist,
  onUpdate,
  onDownloadMetadata,
  onDelete,
}) => {
  const theme = useTheme();

  const handleAction = (action: (file: MediaFileResponseDto) => void) => {
    if (mediaFile) {
      action(mediaFile);
    }
    onClose();
  };

  if (!mediaFile) return null;

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      MenuListProps={{
        'aria-labelledby': `media-options-button-${mediaFile.id}`,
      }}
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: theme.shadows[3],
        },
      }}
    >
      <MenuItem onClick={() => handleAction(onPlay)}>
        <ListItemIcon>
          <PlayArrowIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Play</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => handleAction(onAddToPlaylist)}>
        <ListItemIcon>
          <PlaylistAddIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Add to Playlist</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => handleAction(onUpdate)}>
        <ListItemIcon>
          <EditIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Update Metadata</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => handleAction(onDownloadMetadata)}>
        <ListItemIcon>
          <CloudDownloadIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Download Metadata</ListItemText>
      </MenuItem>
      <MenuItem
        onClick={() => handleAction(onDelete)}
        sx={{ color: theme.palette.error.main }}
      >
        <ListItemIcon sx={{ color: theme.palette.error.main }}>
          <DeleteIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Delete</ListItemText>
      </MenuItem>
      {/* Optional: Add a "View Details" or "Info" option */}
      <MenuItem
        onClick={() =>
          handleAction((file) => console.log('View details for', file.name))
        }
      >
        <ListItemIcon>
          <InfoOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Info</ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default MediaActionMenu;
