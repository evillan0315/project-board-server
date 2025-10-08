import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
  Divider,
} from '@mui/material';
import CustomDrawer from '../Drawer/CustomDrawer';
import { RecordingItem } from './RecordingsTable';

interface RecordingInfoDrawerProps {
  open: boolean;
  onClose: () => void;
  recording: RecordingItem | null;
  onUpdate: (updated: Partial<RecordingItem>) => void;
}

const RECORDING_TYPES = ['screenRecord', 'screenShot', 'cameraRecord']; // Added 'cameraRecord'

export const RecordingInfoDrawer: React.FC<RecordingInfoDrawerProps> = ({
  open,
  onClose,
  recording,
  onUpdate,
}) => {
  const [editable, setEditable] = useState<Partial<RecordingItem>>({
    name: recording?.name,
    type: recording?.type,
  });

  React.useEffect(() => {
    setEditable({ name: recording?.name, type: recording?.type });
  }, [recording]);

  if (!recording) return null;

  const handleSave = () => {
    onUpdate(editable);
  };

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      position="right"
      size="medium"
      title={recording.name}
      stickyFooter={
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </Box>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Editable fields */}
        <TextField
          label="Name"
          value={editable.name || ''}
          onChange={(e) => setEditable({ ...editable, name: e.target.value })}
          size="small"
        />
        <TextField
          label="Type"
          select
          value={editable.type || ''}
          onChange={(e) => setEditable({ ...editable, type: e.target.value })}
          size="small"
        >
          {RECORDING_TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </TextField>

        <Divider />

        {/* Read-only fields */}
        <Box>
          <Typography variant="body2" fontWeight="bold">
            Status:
          </Typography>
          <Typography variant="body2">{recording.status}</Typography>
        </Box>

        <Box>
          <Typography variant="body2" fontWeight="bold">
            Path:
          </Typography>
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
            {recording.path}
          </Typography>
        </Box>

        <Box>
          <Typography variant="body2" fontWeight="bold">
            Created By:
          </Typography>
          <Typography variant="body2">{recording.createdById}</Typography>
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
              {JSON.stringify(recording.data, null, 2)}
            </pre>
          </Box>
        </Box>
      </Box>
    </CustomDrawer>
  );
};
