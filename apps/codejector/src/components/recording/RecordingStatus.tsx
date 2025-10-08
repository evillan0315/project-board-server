import { Box, Typography, Tooltip } from '@mui/material';
import { useStore } from '@nanostores/react';
import {
  isScreenRecordingStore,
  currentRecordingIdStore,
  isCameraRecordingStore,
  currentCameraRecordingIdStore,
} from '@/stores/recordingStore';

export function RecordingStatus() {
  const isScreenRecording = useStore(isScreenRecordingStore);
  const currentScreenRecordingId = useStore(currentRecordingIdStore);

  const isCameraRecording = useStore(isCameraRecordingStore);
  const currentCameraRecordingId = useStore(currentCameraRecordingIdStore);

  const isAnyRecordingActive = isScreenRecording || isCameraRecording;

  return (
    <Box className="flex flex-col gap-1">
      {isScreenRecording && (
        <Tooltip title={`Screen Recording in progress (ID: ${currentScreenRecordingId || 'N/A'})`}>
          <Typography variant="body1" color="error" noWrap>
            ● Screen Recording in progress
            {currentScreenRecordingId && ` (ID: ${currentScreenRecordingId})`}
          </Typography>
        </Tooltip>
      )}
      {isCameraRecording && (
        <Tooltip title={`Camera Recording in progress (ID: ${currentCameraRecordingId || 'N/A'})`}>
          <Typography variant="body1" color="error" noWrap>
            ● Camera Recording in progress
            {currentCameraRecordingId && ` (ID: ${currentCameraRecordingId})`}
          </Typography>
        </Tooltip>
      )}

      {!isAnyRecordingActive && (
        <Tooltip title="No active recording">
          <Typography variant="body1" color="text.secondary" noWrap>
            No active recording
          </Typography>
        </Tooltip>
      )}
    </Box>
  );
}
