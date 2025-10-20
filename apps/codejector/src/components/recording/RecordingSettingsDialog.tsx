import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';
import { useStore } from '@nanostores/react';
import { IRecorderSettings } from './types/recording';
import { recorderSettingsStore, isRecordingSettingsDialogOpenStore, setIsRecordingSettingsDialogOpen } from './stores/recordingStore';

interface RecordingSettingsDialogProps {
  open: boolean; // Keep for the Dialog component itself
  onClose: () => void; // Keep to allow explicit close action from parent
}

const RESOLUTION_OPTIONS = ['1920x1080', '1280x720', '800x600'];
const FRAMERATE_OPTIONS = [15, 24, 30, 60];
const CAMERA_VIDEO_DEVICE_OPTIONS = ['/dev/video0', '/dev/video1'];
const CAMERA_AUDIO_DEVICE_OPTIONS = [
  'alsa_input.pci-0000_00_1b.0.analog-stereo',
  'default',
];

export const RecordingSettingsDialog: React.FC<RecordingSettingsDialogProps> = ({
  open: propOpen, // Rename prop to avoid conflict with store value
  onClose: propOnClose, // Rename prop to avoid conflict with store value
}) => {
  const currentSettings = useStore(recorderSettingsStore);
  const isSettingsDialogOpen = useStore(isRecordingSettingsDialogOpenStore);
  const [formSettings, setFormSettings] = useState<IRecorderSettings>(currentSettings);

  useEffect(() => {
    if (isSettingsDialogOpen) {
      setFormSettings(currentSettings);
    }
  }, [currentSettings, isSettingsDialogOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormSettings((prev) => ({
      ...prev,
      [name]:
        name === 'screenFramerate' || name === 'cameraFramerate'
          ? Number(value)
          : value,
    }));
  };

  const handleSave = () => {
    recorderSettingsStore.set(formSettings);
    setIsRecordingSettingsDialogOpen(false);
    propOnClose(); // Call the prop-provided onClose to allow parent to react if needed
  };

  const handleClose = () => {
    setIsRecordingSettingsDialogOpen(false);
    propOnClose(); // Call the prop-provided onClose to allow parent to react if needed
  };

  return (
    <Dialog open={isSettingsDialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Recorder Settings</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="Recording Name Prefix"
            name="namePrefix"
            value={formSettings.namePrefix}
            onChange={handleChange}
            fullWidth
            size="small"
            helperText="Prefix for all new recordings (e.g., 'codejector-recording')"
          />

          <Typography variant="h6" sx={{ mt: 2 }}>
            Screen Recording
          </Typography>
          <TextField
            label="Screen Resolution"
            name="screenResolution"
            select
            value={formSettings.screenResolution}
            onChange={handleChange}
            fullWidth
            size="small"
          >
            {RESOLUTION_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Screen Framerate (FPS)"
            name="screenFramerate"
            type="number"
            select
            value={formSettings.screenFramerate}
            onChange={handleChange}
            fullWidth
            size="small"
          >
            {FRAMERATE_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>

          <Typography variant="h6" sx={{ mt: 2 }}>
            Camera Recording
          </Typography>
          <TextField
            label="Camera Resolution"
            name="cameraResolution"
            select
            value={formSettings.cameraResolution}
            onChange={handleChange}
            fullWidth
            size="small"
          >
            {RESOLUTION_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Camera Framerate (FPS)"
            name="cameraFramerate"
            type="number"
            select
            value={formSettings.cameraFramerate}
            onChange={handleChange}
            fullWidth
            size="small"
          >
            {FRAMERATE_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Camera Video Device"
            name="cameraVideoDevice"
            select
            value={formSettings.cameraVideoDevice}
            onChange={handleChange}
            fullWidth
            size="small"
            helperText="Linux device path (e.g., '/dev/video0')"
          >
            {CAMERA_VIDEO_DEVICE_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Camera Audio Device"
            name="cameraAudioDevice"
            select
            value={formSettings.cameraAudioDevice}
            onChange={handleChange}
            fullWidth
            size="small"
            helperText="PulseAudio source (e.g., 'alsa_input...')"
          >
            {CAMERA_AUDIO_DEVICE_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained">
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};
