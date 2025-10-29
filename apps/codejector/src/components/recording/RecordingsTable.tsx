import React, { useState } from 'react';
import {
  IconButton,
  Box,
  SxProps,
  Theme,
  Tooltip,
  Button,
  DialogContentText,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import GifIcon from '@mui/icons-material/Gif';
import StopCircle from '@mui/icons-material/StopCircle';

import VideocamIcon from '@mui/icons-material/Videocam';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ImageIcon from '@mui/icons-material/Image';

import { RecordingItem, SortField, SortOrder, RecordingType } from './types/recording';
import { useStore } from '@nanostores/react';
import {
  recordingsListStore,
  recordingsSortByStore,
  recordingsSortOrderStore,
  setRecordingsSortBy,
  setRecordingsSortOrder,
  setRecordingsPage,
} from './stores/recordingStore';

import { TableList, TableListColumn } from '@/components/ui/views/table/TableList'; // Import TableList
import { showDialog, hideDialog } from '@/stores/dialogStore';

interface RecordingsTableProps {
  recordings: RecordingItem[];
  total: number; // New prop for pagination
  page: number; // New prop for pagination
  rowsPerPage: number; // New prop for pagination
  onPageChange: (newPage: number) => void; // New prop for pagination
  onRowsPerPageChange: (rowsPerPage: number) => void; // New prop for pagination
  onPlay: (recording: RecordingItem) => void;
  onDelete: (id: string) => void;
  onView: (recording: RecordingItem) => void;
  onConvertToGif: (recording: RecordingItem) => void;
  onStopRecording: (id: string, type: RecordingType) => void;
}

// Styles for the stop recording icon, matching color of RecordingControls stop button
const errorIconColorSx: SxProps<Theme> = (theme) => ({
  color: theme.palette.error.main,
});

const stopRecordingIconSx: SxProps<Theme> = (theme) => ({
  ...errorIconColorSx(theme),
  fontSize: '1.5rem', // Slightly larger for emphasis, fits table cell
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  padding: 0,
  cursor: 'pointer',
});

const RecordingsTable: React.FC<RecordingsTableProps> = ({
  recordings,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onPlay,
  onDelete,
  onView,
  onConvertToGif,
  onStopRecording,
}) => {
  const theme = useTheme();
  const sortBy = useStore(recordingsSortByStore);
  const sortOrder = useStore(recordingsSortOrderStore);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const handleTableListSort = (columnId: string, direction: SortOrder) => {
    setRecordingsSortBy(columnId as SortField);
    setRecordingsSortOrder(direction);
    setRecordingsPage(0);
  };

  const handleDeleteClick = (id: string, name: string) => {
    showDialog({
      title: (
        <Box
          sx={{
            backgroundColor: theme.palette.error.main,
            color: theme.palette.error.contrastText,
            p: 2,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
            Confirm Deletion
          </Typography>
        </Box>
      ),
      content: (
        <DialogContentText id="alert-dialog-description" sx={{ p: 2 }}>
          Are you sure you want to delete the recording \"{name}\" This action cannot be undone."
        </DialogContentText>
      ),
      actions: (
        <>
          <Button onClick={hideDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={() => {
              onDelete(id);
              hideDialog();
            }}
            variant="contained"
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </>
      ),
      maxWidth: 'xs',
      fullWidth: true,
      showCloseButton: true,
    });
  };

  const columns: TableListColumn<RecordingItem>[] = [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      render: (recording) => recording.name,
    },
    {
      id: 'type',
      label: 'Type',
      sortable: true,
      render: (recording) => {
        if (recording.status === 'recording') {
          return (
            <Box className="flex items-center justify-start gap-1">
              <Tooltip title={`Stop ${recording.type === 'screenRecord' ? 'Screen' : 'Camera'} Recording`}>
                <IconButton
                  aria-label={`stop ${recording.type} recording`}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent row click from firing
                    onStopRecording(recording.id, recording.type);
                  }}
                  sx={stopRecordingIconSx(theme)}
                >
                  <StopCircle fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        }

        let icon = null;
        let tooltipText = '';
        switch (recording.type) {
          case 'screenRecord':
            icon = <VideocamIcon fontSize="small" />;
            tooltipText = 'Screen Recording';
            break;
          case 'cameraRecord':
            icon = <CameraAltIcon fontSize="small" />;
            tooltipText = 'Camera Recording';
            break;
          case 'screenShot':
            icon = <ImageIcon fontSize="small" />;
            tooltipText = 'Screenshot';
            break;
          default:
            icon = null;
            tooltipText = '';
        }

        return (
          <Box className="flex items-center gap-1">
            {icon && <Tooltip title={tooltipText}>{icon}</Tooltip>}
          </Box>
        );
      },
    },
    {
      id: 'sizeBytes',
      label: 'Size',
      sortable: true,
      render: (recording) => formatBytes(recording.sizeBytes),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      sortable: true,
      render: (recording) => new Date(recording.createdAt).toLocaleString(),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      sortable: false,
      render: (recording) => (
        <Box className="flex justify-end space-x-2">
          {recording.type === 'screenRecord' &&
            !recording.data?.animatedGif &&
            recording.status !== 'recording' && (
              <IconButton
                onClick={() => onConvertToGif(recording)}
                color="primary"
                title="Convert to GIF"
              >
                <GifIcon />
              </IconButton>
            )}
          {((recording.type === 'screenRecord' ||
            recording.type === 'cameraRecord') &&
            recording.status !== 'recording') && (
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
              <PlayArrowIcon />
            </IconButton>
          )}
          {recording.data?.animatedGif && (
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
            onClick={() => handleDeleteClick(recording.id, recording.name)}
            color="error"
            title="Delete"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <TableList
      columns={columns}
      data={recordings}
      sortColumn={sortBy}
      sortDirection={sortOrder}
      onSort={handleTableListSort}
      total={total}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={(event, newPage) => onPageChange(newPage)} // Pass newPage directly
      onRowsPerPageChange={(event) => onRowsPerPageChange(parseInt(event.target.value, 10))} // Pass parsed value
      // Custom styling for the TableList container to match original Paper styling
      containerSx={(theme) => ({
        borderRadius: '8px',
        boxShadow: theme.shadows[3],
        backgroundColor: theme.palette.background.paper,
      })}
      // Optional: Pass specific styling for head, header cells, rows, and cells if TableList supports it
      headSx={(theme) => ({
        backgroundColor:
          theme.palette.mode === 'dark'
            ? theme.palette.grey[800]
            : theme.palette.primary.light,
      })}
      headerCellSx={(theme) => ({
        color: theme.palette.primary.contrastText,
        fontWeight: 'bold',
        padding: theme.spacing(2),
        whiteSpace: 'nowrap',
      })}
      rowSx={(theme) => ({
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
      })}
      cellSx={(theme) => ({
        color: theme.palette.text.primary,
        padding: theme.spacing(2),
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      })}
    />
  );
};

export { RecordingsTable };
