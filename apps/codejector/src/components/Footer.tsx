import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  isScreenRecordingStore,
  currentRecordingIdStore,
  setIsScreenRecording,
  isCameraRecordingStore,
  currentCameraRecordingIdStore,
  setIsCameraRecording,
  recorderSettingsStore, // Import recorderSettingsStore
} from '@/components/recording/stores/recordingStore';
import { recordingApi } from '@/components/recording/api/recording';
import { setSnackbarState } from '@/stores/snackbarStore';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import DynamicIcon from './DynamicIcon';
import CustomDrawer from '@/components/Drawer/CustomDrawer';
import OutputLogger from '@/components/OutputLogger';
import MediaPlayerContainer from '@/components/media/MediaPlayerContainer';
import { RecordingControls } from '@/components/recording/RecordingControls';
import { RecordingStatus } from '@/components/recording/RecordingStatus';
import { StartCameraRecordingDto } from '@//components/recording/types/recording'; // Corrected import path/type

const Footer = () => {
  const theme = useTheme();
  const isScreenRecording = useStore(isScreenRecordingStore);
  const currentScreenRecordingId = useStore(currentRecordingIdStore);

  const isCameraRecording = useStore(isCameraRecordingStore);
  const currentCameraRecordingId = useStore(currentCameraRecordingIdStore);
  const currentRecorderSettings = useStore(recorderSettingsStore); // Get recorder settings

  const [isCapturing, setIsCapturing] = useState(false);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);

  const notify = (
    message: string,
    severity: 'success' | 'info' | 'warning' | 'error',
  ) => {
    setSnackbarState({ open: true, message, severity });
  };

  const handleStartScreenRecording = async () => {
    try {
      const recordingData = await recordingApi.startRecording();
      if (recordingData?.id) {
        currentRecordingIdStore.set(recordingData.id);
        setIsScreenRecording(true);
        notify('Screen recording started successfully!', 'success');
      }
    } catch (error) {
      console.error('Error starting screen recording:', error);
      notify(`Error starting screen recording: ${error}`, 'error');
    }
  };

  const handleStopScreenRecording = async () => {
    try {
      if (currentScreenRecordingId) {
        await recordingApi.stopRecording(currentScreenRecordingId);
        currentRecordingIdStore.set(null);
        setIsScreenRecording(false);
        notify('Screen recording stopped successfully!', 'success');
      }
    } catch (error) {
      console.error('Error stopping screen recording:', error);
      notify(`Error stopping screen recording: ${error}`, 'error');
    }
  };

  const handleStartCameraRecording = async () => {
    try {
      const dto: StartCameraRecordingDto = {
        cameraDevice: currentRecorderSettings.cameraVideoDevice,
        audioDevice: currentRecorderSettings.cameraAudioDevice,
        resolution: currentRecorderSettings.cameraResolution,
        framerate: currentRecorderSettings.cameraFramerate,
        name: `${currentRecorderSettings.namePrefix}-camera-record-${Date.now()}`,
      };
      const recordingData = await recordingApi.startCameraRecording(dto);
      if (recordingData?.id) {
        currentCameraRecordingIdStore.set(recordingData.id);
        setIsCameraRecording(true);
        notify('Camera recording started successfully!', 'success');
      }
    } catch (error) {
      console.error('Error starting camera recording:', error);
      notify(`Error starting camera recording: ${error}`, 'error');
    }
  };

  const handleStopCameraRecording = async () => {
    try {
      if (currentCameraRecordingId) {
        await recordingApi.stopCameraRecording(currentCameraRecordingId);
        currentCameraRecordingIdStore.set(null);
        setIsCameraRecording(false);
        notify('Camera recording stopped successfully!', 'success');
      }
    } catch (error) {
      console.error('Error stopping camera recording:', error);
      notify(`Error stopping camera recording: ${error}`, 'error');
    }
  };

  const handleCaptureScreenshot = async () => {
    setIsCapturing(true);
    try {
      await recordingApi.capture();
      notify('Screenshot captured successfully!', 'success');
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      notify(`Error capturing screenshot: ${error}`, 'error');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleOpenLogDrawer = () => {
    setLogDrawerOpen(true);
  };

  const handleCloseLogDrawer = () => {
    setLogDrawerOpen(false);
  };

  // No change needed for onOpenSettings in Footer, as the Recording component handles the settings dialog state.
  const handleOpenSettings = () => {
    // This handler can remain empty or trigger a notification if settings are only editable via RecordingPage
    notify('Recording settings are managed on the Recordings page.', 'info');
  };

  return (
    <>
      <Box
        className="flex justify-between items-center w-full"
        sx={{
          bgcolor: theme.palette.background.paper,
          borderTop: `1px solid ${theme.palette.divider}`,
          minHeight: 40,
          zIndex: theme.zIndex.appBar + 1,
        }}
      >
        <Box className="flex justify-start items-center">
          <Box className="flex-grow relative">
            <MediaPlayerContainer />
          </Box>
        </Box>
        <Box className="flex justify-start items-center gap-4 w-1/4 pl-4"></Box>
        <Box className="flex justify-center items-center w-1/2 max-w-[600px]">
          <IconButton
            color="inherit"
            aria-label="open output logger"
            onClick={handleOpenLogDrawer}
          >
            <DynamicIcon iconName="CarbonTerminal" />
          </IconButton>
          <Box className="flex items-center flex-shrink">
            <RecordingControls
              isScreenRecording={isScreenRecording}
              isCameraRecording={isCameraRecording}
              isCapturing={isCapturing}
              onStartScreenRecording={handleStartScreenRecording}
              onStopScreenRecording={handleStopScreenRecording}
              onStartCameraRecording={handleStartCameraRecording}
              onStopCameraRecording={handleStopCameraRecording}
              onCapture={handleCaptureScreenshot}
              onOpenSettings={handleOpenSettings} // Use local handleOpenSettings
            />

            <RecordingStatus />
          </Box>
        </Box>
      </Box>

      <CustomDrawer
        open={logDrawerOpen}
        onClose={handleCloseLogDrawer}
        position="bottom"
        size="medium"
        title="Output Logger"
      >
        <OutputLogger />
      </CustomDrawer>
    </>
  );
};

export default Footer;
