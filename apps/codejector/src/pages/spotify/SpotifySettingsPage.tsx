import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper,
  useTheme,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import FolderOpenIcon from '@mui/icons-material/FolderOpenOutlined';
import ScanIcon from '@mui/icons-material/ScreenSearchDesktop';
import ClearIcon from '@mui/icons-material/Clear';

import { useStore } from '@nanostores/react';
import {
  $spotifyStore,
  setMediaScanPath,
  triggerMediaScan,
} from '@/stores/spotifyStore';
import { aiEditorStore, showGlobalSnackbar } from '@/stores/aiEditorStore';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';


interface SpotifySettingsPageProps {}

const SpotifySettingsPage: React.FC<SpotifySettingsPageProps> = () => {
  const theme = useTheme();
  const { mediaScanPath, isScanningMedia, mediaScanError } =
    useStore($spotifyStore);
  const currentProjectPath = useStore(projectRootDirectoryStore);

  const [isPickerDialogOpen, setIsPickerDialogOpen] = React.useState(false);

  const handleScan = () => {
    if (!mediaScanPath.trim()) {
      showGlobalSnackbar('Please enter a directory path to scan.', 'error');
      return;
    }
    triggerMediaScan(mediaScanPath);
  };

  const handleClearPath = () => {
    setMediaScanPath('');
    showGlobalSnackbar('Scan path cleared.', 'info');
  };

  const handleDirectorySelected = (path: string) => {
    setMediaScanPath(path);
    setIsPickerDialogOpen(false);
    showGlobalSnackbar(`Scan path set to: ${path}`, 'success');
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        mx: 'auto',
        my: 4,
        maxWidth: '900px',
        width: '100%',
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        flexGrow: 1,
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <SettingsIcon sx={{ fontSize: 40 }} /> App Settings
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Configure application-specific settings, such as media scanning
        directories.
      </Typography>

      <Box sx={{ mt: 3 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 'bold', mb: 2 }}
          color="text.primary"
        >
          Media Scan Settings
        </Typography>

        {mediaScanError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {mediaScanError}
          </Alert>
        )}

        <TextField
          label="Directory Path for Media Scan"
          fullWidth
          value={mediaScanPath}
          onChange={(e) => setMediaScanPath(e.target.value)}
          placeholder="e.g., /home/user/music or C:\Users\user\Videos"
          disabled={isScanningMedia}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            style: { color: theme.palette.text.primary },
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Browse for directory">
                  <span>
                    <IconButton
                      onClick={() => setIsPickerDialogOpen(true)}
                      disabled={isScanningMedia}
                      color="primary"
                      size="small"
                    >
                      <FolderOpenIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Clear path">
                  <span>
                    <IconButton
                      onClick={handleClearPath}
                      disabled={isScanningMedia || !mediaScanPath.trim()}
                      color="secondary"
                      size="small"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />

        <Button
          variant="contained"
          color="primary"
          startIcon={
            isScanningMedia ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <ScanIcon />
            )
          }
          onClick={handleScan}
          disabled={isScanningMedia || !mediaScanPath.trim()}
          sx={{ mt: 2, py: 1.5, fontSize: '1.05rem' }}
        >
          {isScanningMedia ? 'Scanning...' : 'Scan Now'}
        </Button>
      </Box>


    </Paper>
  );
};

export default SpotifySettingsPage;
