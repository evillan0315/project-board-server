import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  SxProps,
  Theme,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import GifIcon from '@mui/icons-material/Gif';

import { RecordingItem } from './Recording'; // Re-exporting RecordingItem as RecordingItem

interface RecordingsTableProps {
  recordings: RecordingItem[];
  onPlay: (recording: RecordingItem) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (recording: RecordingItem) => void;
  onSort: (field: keyof RecordingItem) => void;
  sortBy: keyof RecordingItem;
  sortOrder: 'asc' | 'desc';
  onConvertToGif: (recording: RecordingItem) => void; // New prop
}

const tableContainerSx: SxProps<Theme> = (theme) => ({
  borderRadius: '8px',
  boxShadow: theme.shadows[3],
  backgroundColor: theme.palette.background.paper,
});

const tableHeadSx: SxProps<Theme> = (theme) => ({
  backgroundColor:
    theme.palette.mode === 'dark'
      ? theme.palette.grey[800]
      : theme.palette.primary.light,
});

const tableHeaderCellSx: SxProps<Theme> = (theme) => ({
  color: theme.palette.primary.contrastText,
  fontWeight: 'bold',
  padding: theme.spacing(2),
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

const tableBodyRowSx: SxProps<Theme> = (theme) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
});

const tableBodyCellSx: SxProps<Theme> = (theme) => ({
  color: theme.palette.text.primary,
  padding: theme.spacing(2),
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const RecordingsTable: React.FC<RecordingsTableProps> = ({
  recordings,
  onPlay,
  onEdit,
  onDelete,
  onView,
  onSort,
  sortBy,
  sortOrder,
  onConvertToGif,
}) => {
  const theme = useTheme();

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <TableContainer component={Paper} sx={tableContainerSx(theme)}>
      <Table className="min-w-full">
        <TableHead sx={tableHeadSx(theme)}>
          <TableRow>
            <TableCell
              sx={tableHeaderCellSx(theme)}
              onClick={() => onSort('name')}
            >
              Name {sortBy === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
            </TableCell>
            <TableCell
              sx={tableHeaderCellSx(theme)}
              onClick={() => onSort('type')}
            >
              Type {sortBy === 'type' && (sortOrder === 'asc' ? '▲' : '▼')}
            </TableCell>
            <TableCell
              sx={tableHeaderCellSx(theme)}
              onClick={() => onSort('status')}
            >
              Status {sortBy === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}
            </TableCell>
            <TableCell
              sx={tableHeaderCellSx(theme)}
              onClick={() => onSort('sizeBytes')}
            >
              Size {sortBy === 'sizeBytes' && (sortOrder === 'asc' ? '▲' : '▼')}
            </TableCell>
            <TableCell
              sx={tableHeaderCellSx(theme)}
              onClick={() => onSort('createdAt')}
            >
              Created At{' '}
              {sortBy === 'createdAt' && (sortOrder === 'asc' ? '▲' : '▼')}
            </TableCell>
            <TableCell sx={{ ...tableHeaderCellSx(theme), textAlign: 'right' }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody sx={{ backgroundColor: theme.palette.background.default }}>
          {recordings.map((recording) => (
            <TableRow key={recording.id} sx={tableBodyRowSx(theme)}>
              <TableCell sx={tableBodyCellSx(theme)}>
                {recording.name}
              </TableCell>
              <TableCell sx={tableBodyCellSx(theme)}>
                {recording.type}
              </TableCell>
              <TableCell sx={tableBodyCellSx(theme)}>
                {recording.status}
              </TableCell>
              <TableCell sx={tableBodyCellSx(theme)}>
                {formatBytes(recording.sizeBytes)}
              </TableCell>
              <TableCell sx={tableBodyCellSx(theme)}>
                {new Date(recording.createdAt).toLocaleString()}
              </TableCell>
              <TableCell sx={{ ...tableBodyCellSx(theme), textAlign: 'right' }}>
                <Box className="flex justify-end space-x-2">
                  {recording.type === 'screenRecord' &&
                    !recording.data?.animatedGif && (
                      <IconButton
                        onClick={() => onConvertToGif(recording)}
                        color="primary"
                        title="Convert to GIF"
                      >
                        <GifIcon />
                      </IconButton>
                    )}
                  {(recording.type === 'screenRecord' ||
                    recording.type === 'cameraRecord') && (
                    <IconButton
                      onClick={() => onPlay(recording)}
                      color="primary"
                      title="Play Recording"
                    >
                      <PlayArrowIcon />
                    </IconButton>
                  )}
                  {recording.type === 'screenShot' && (
                    <IconButton
                      onClick={() => onPlay(recording)}
                      color="primary"
                      title="View Screenshot"
                    >
                      <PlayArrowIcon />{' '}
                      {/* Re-using PlayArrow for consistency, but means 'view' */}
                    </IconButton>
                  )}
                  {recording.data?.animatedGif && ( // MODIFIED: Simplified onPlay call for GIF
                    <IconButton
                      onClick={() => onPlay(recording)}
                      color="primary"
                      title="View Animated GIF"
                    >
                      <GifIcon />
                    </IconButton>
                  )}
                  <IconButton
                    onClick={() => onView(recording)}
                    color="info"
                    title="View Details"
                  >
                    <InfoIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => onEdit(recording.id)}
                    color="secondary"
                    title="Edit"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => onDelete(recording.id)}
                    color="error"
                    title="Delete"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export { RecordingsTable };
