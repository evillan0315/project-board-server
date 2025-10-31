import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import {
  isScreenRecordingStore,
  currentRecordingIdStore,
  setIsScreenRecording,
  isCameraRecordingStore,
  currentCameraRecordingIdStore,
  setIsCameraRecording,
  recorderSettingsStore, // Import recorderSettingsStore
  setIsRecordingSettingsDialogOpen, // <-- NEW: Import the setter for settings dialog
} from '@/components/recording/stores/recordingStore';
import { recordingApi } from '@/components/recording/api/recording';
import { setSnackbarState } from '@/stores/snackbarStore';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { CarbonTerminal } from '@/components/icons/CarbonTerminal';
import { CarbonTerminal3270 } from '@/components/icons/CarbonTerminal3270';
import { LogsIcon } from '@/components/icons/LogsIcon';
import DynamicIcon from './DynamicIcon';
import CustomDrawer from '@/components/Drawer/CustomDrawer';
import OutputLogger from '@/components/OutputLogger';
import MediaPlayerContainer from '@/components/media/MediaPlayerContainer';
import { RecordingControls } from '@/components/recording/RecordingControls';
import { RecordingStatus } from '@/components/recording/RecordingStatus';
import { StartCameraRecordingDto } from '@//components/recording/types/recording'; // Corrected import path/type
import { XTerminal } from '@/components/Terminal/Terminal'; // NEW: Import XTerminal
import { handleLogout } from '@/services/authService'; // NEW: Import handleLogout for terminal
import { disconnectTerminal } from '@/components/Terminal/stores/terminalStore'; // NEW: Import disconnectTerminal
const terminalDrawerContentStyle = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
};
const Footer = () => {
  const theme = useTheme();
  const navigate = useNavigate(); // NEW: For logout navigation
  const isScreenRecording = useStore(isScreenRecordingStore);
  const currentScreenRecordingId = useStore(currentRecordingIdStore);
  const isCameraRecording = useStore(isCameraRecordingStore);
  const currentCameraRecordingId = useStore(currentCameraRecordingIdStore);
  const currentRecorderSettings = useStore(recorderSettingsStore); // Get recorder settings
  const [isCapturing, setIsCapturing] = useState(false);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [terminalDrawerOpen, setTerminalDrawerOpen] = useState(false); // NEW: State for terminal drawer
  const notify = (
    message: string,
    severity: 'success' | 'info' | 'warning' | 'error',
  ) => {
    setSnackbarState({ open: true, message, severity });
  };
  const handleStartScreenRecording = async () => {
    try {
      // NOTE: The full Recording component handles the audio device selection dialog.
      // For simplified footer controls, we'll start without audio or with a default.
      // If the full dialog flow is desired here, it needs to be replicated.
      const dto = {
        name: `${currentRecorderSettings.namePrefix}-screen-record-${Date.now()}`,
        enableAudio: currentRecorderSettings.enableScreenAudio,
        audioDevice: currentRecorderSettings.enableScreenAudio
          ? currentRecorderSettings.screenAudioDevice
          : undefined,
      };
      const recordingData = await recordingApi.startRecording(dto);
      if (recordingData?.id) {
        currentRecordingIdStore.set(recordingData.id);
        setIsScreenRecording(true);
        notify('Screen recording started successfully!', 'success');
      }
    } catch (error) {
//       console.error('Error starting screen recording:', error);
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
//       console.error('Error stopping screen recording:', error);
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
//       console.error('Error starting camera recording:', error);
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
//       console.error('Error stopping camera recording:', error);
      notify(`Error stopping camera recording: ${error}`, 'error');
    }
  };
  const handleCaptureScreenshot = async () => {
    setIsCapturing(true);
    try {
      await recordingApi.capture();
      notify('Screenshot captured successfully!', 'success');
    } catch (error) {
//       console.error('Error capturing screenshot:', error);
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
  // NEW: Terminal Drawer handlers
  const handleOpenTerminalDrawer = () => {
    setTerminalDrawerOpen(true);
  };
  const handleCloseTerminalDrawer = () => {
    setTerminalDrawerOpen(false);
    // Ensure the terminal socket is disconnected when the drawer closes
    disconnectTerminal();
  };
  // NEW: Directly open the recording settings dialog using the store setter
  const handleOpenSettings = () => {
    setIsRecordingSettingsDialogOpen(true);
  };
  return (
    <>
      <Box
        className="flex justify-between items-center w-full"
        sx={{
          bgcolor: theme.palette.background.paper,
          borderTop: `1px solid ${theme.palette.divider}`,
          zIndex: theme.zIndex.appBar + 1,
        }}
      >
        <Box className="flex justify-start items-center flex-grow ">
          <MediaPlayerContainer />
        </Box>
        <Box className="flex justify-end items-center w-1/2 max-w-[600px] pr-4">
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
          </Box>
          <IconButton
            color="inherit"
            aria-label="open output logger"
            onClick={handleOpenLogDrawer}
          >
            <LogsIcon fontSize={`1em`} />
          </IconButton>
          <IconButton
            color="inherit"
            aria-label="open terminal"
            onClick={handleOpenTerminalDrawer}
          >
            <CarbonTerminal fontSize={`1em`} />
          </IconButton>
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

      <CustomDrawer
        open={terminalDrawerOpen}
        onClose={handleCloseTerminalDrawer}
        position="bottom"
        size="normal"
        hasBackdrop={true}
        //title="Terminal"
      >
        <Box sx={terminalDrawerContentStyle}>
          <XTerminal
            onLogout={() => handleLogout().then(() => navigate('/login'))}
            onCloseDrawer={handleCloseTerminalDrawer} // Pass drawer's close handler to XTerminal
          />
        </Box>
      </CustomDrawer>
    </>
  );
};
export default Footer;
