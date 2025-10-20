import React, { useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
  Divider,
} from '@mui/material';
import CustomDrawer from '../Drawer/CustomDrawer';
import { RecordingItem, RecordingType } from './types/recording';
import { useStore } from '@nanostores/react';
import {
  editableRecordingStore,
  selectedRecordingStore,
  recordingDrawerOpenStore,
  setEditableRecording,
  setRecordingDrawerOpen,
  setSelectedRecording,
} from './stores/recordingStore';

interface RecordingInfoDrawerProps {
  open: boolean; // This prop is still needed for CustomDrawer's own state management
  onClose: () => void;
  recording: RecordingItem | null;
  onUpdate: () => void; // No longer takes an argument, reads from store
}

const RECORDING_TYPES: RecordingType[] = ['screenRecord', 'screenShot', 'cameraRecord'];

export const RecordingInfoDrawer: React.FC<RecordingInfoDrawerProps> = ({
  open, // Keep for CustomDrawer
  onClose,
  recording: recordingProp, // Rename prop to avoid conflict with store value
  onUpdate,
}) => {
  const selectedRecording = useStore(selectedRecordingStore); // Use store
  const editableRecording = useStore(editableRecordingStore); // Use store
  const isDrawerOpen = useStore(recordingDrawerOpenStore); // Use store

  useEffect(() => {
    // Initialize editable state from selectedRecording when drawer opens or selectedRecording changes
    if (selectedRecording) {
      setEditableRecording({
        name: selectedRecording.name,
        type: selectedRecording.type,
      });
    } else {
      setEditableRecording({});
    }
  }, [selectedRecording]);

  if (!selectedRecording) return null;

  const handleClose = () => {
    setRecordingDrawerOpen(false);
    setSelectedRecording(null);
    setEditableRecording({}); // Clear editable state on close
    onClose(); // Call the prop-provided onClose to allow parent to react if needed
  };

  const handleSave = () => {
    onUpdate(); // Parent component will read editableRecording from store
  };

  return (
    <CustomDrawer
      open={isDrawerOpen} // Use store state for drawer visibility
      onClose={handleClose}
      position="right"
      size="medium"
      title={selectedRecording.name}
      stickyFooter={
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </Box>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TextField
          label="Name"
          value={editableRecording.name || ''}
          onChange={(e) =>
            setEditableRecording({ ...editableRecording, name: e.target.value })
          }
          fullWidth
          size="small"
        />
        <TextField
          label="Type"
          select
          value={editableRecording.type || ''}
          onChange={(e) =>
            setEditableRecording({ ...editableRecording, type: e.target.value as RecordingType })
          }
          fullWidth
          size="small"
        >
          {RECORDING_TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </TextField>

        <Divider />

        <Box>
          <Typography variant="body2" fontWeight="bold">
            Status:
          </Typography>
          <Typography variant="body2">{selectedRecording.status}</Typography>
        </Box>

        <Box>
          <Typography variant="body2" fontWeight="bold">
            Path:
          </Typography>
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
            {selectedRecording.path}
          </Typography>
        </Box>

        <Box>
          <Typography variant="body2" fontWeight="bold">
            Created By:
          </Typography>
          <Typography variant="body2">{selectedRecording.createdById}</Typography>
        </Box>

        <Box>
          <Typography variant="body2" fontWeight="bold">
            Data:
          </Typography>
          <Box
            sx={{
              maxHeight: 300,
              overflow: 'auto',
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 1,
              mt: 1,
            }}
          >
            <pre style={{ margin: 0 }}>
              {JSON.stringify(selectedRecording.data, null, 2)}
            </pre>
          </Box>
        </Box>
      </Box>
    </CustomDrawer>
  );
};
