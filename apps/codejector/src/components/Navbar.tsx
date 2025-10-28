import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore'; // Only the store, no globalSnackbar
import { isRightSidebarVisible, isLeftSidebarVisible } from '@/stores/uiStore';
import { snackbarState, setSnackbarState } from '@/stores/snackbarStore';
import { handleLogout } from '@/services/authService';
import {
  runTerminalCommand,
  fetchProjectScripts,
} from '@/components/Terminal/api/terminal';
import ThemeToggle from './ThemeToggle';
import RunScriptMenuItem from './RunScriptMenuItem';
import AppsMenuContent from './AppsMenuContent';
import ProfileMenuContent from './ProfileMenuContent';
import { appDefinitions } from '@/constants/appDefinitions';
import { profileMenuDefinitions } from '@/constants/profileMenuDefinitions';
import { getNavbarAppDefinitions, $navbarApps } from '@/stores/navbarAppsStore'; // NEW import for dynamic apps menu
import {
  type PackageScript,
  type TerminalCommandResponse,
  ScriptStatus,
  type PackageManager,
} from '@/components/Terminal/types/terminal';
import { APP_NAME } from '@/constants';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import AccountCircle from '@mui/icons-material/AccountCircle';
import CircularProgress from '@mui/material/CircularProgress';
import VerticalSplitIcon from '@mui/icons-material/VerticalSplit';
import VerticalSplitOutlinedIcon from '@mui/icons-material/WebAssetOutlined';
import WebAssetOutlinedIcon from '@mui/icons-material/WebAssetOutlined';
import { useTheme } from '@mui/material/styles';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TerminalIcon from '@mui/icons-material/Terminal';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LinearProgress from '@mui/material/LinearProgress';
import AppsIcon from '@mui/icons-material/Apps';
import IconButton from '@mui/material/IconButton';
import ViewSidebar from '@mui/icons-material/ViewSidebar';

import ViewSidebarOff from '@mui/icons-material/ViewSidebar';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import {
  CodiconLayoutPanelLeft,
  CodiconLayoutSidebarLeft,
  CodiconLayoutSidebarLeftOff,
} from '@/components/icons/CodiconLayoutPanelLeft';
import {
  CodiconLayoutPanelRight,
  CodiconLayoutSidebarRight,
} from '@/components/icons/CodiconLayoutPanelRight';
import { CodiconLayoutSidebarRightOff } from '@/components/icons/CodiconLayoutPanelRight';

import { isScreenRecordingStore } from '@//components/recording/stores/recordingStore';

interface ScriptExecutionState {
  status: ScriptStatus;
  message: string | null;
  output: TerminalCommandResponse | null;
}

const Navbar: React.FC = () => {
  const { isLoggedIn, user, loading: authLoading } = useStore(authStore);
  const currentProjectPath = useStore(projectRootDirectoryStore);
  const $snackbarState = useStore(snackbarState);
  const navigate = useNavigate();
  const theme = useTheme();
  const $isLeftSidebarVisible = useStore(isLeftSidebarVisible);
  const $isRightSidebarVisible = useStore(isRightSidebarVisible);
  const [packageScripts, setPackageScripts] = useState<PackageScript[]>([]);
  const [packageManager, setPackageManager] = useState<PackageManager>(null);
  const [scriptsLoading, setScriptsLoading] = useState(false);
  const [scriptExecutionStatus, setScriptExecutionStatus] = useState<
    Record<string, ScriptExecutionState>
  >({});

  const [scriptMenuAnchorEl, setScriptMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [appsMenuAnchorEl, setAppsMenuAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [profileMenuAnchorEl, setProfileMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const isRecording = useStore(isScreenRecordingStore);

  const isScriptMenuOpen = Boolean(scriptMenuAnchorEl);
  const isAppsMenuOpen = Boolean(appsMenuAnchorEl);
  const isProfileMenuOpen = Boolean(profileMenuAnchorEl);

  // NEW: Subscribe to the navbarAppsStore to reactively update the apps menu
  useStore($navbarApps);
  const navbarApps = getNavbarAppDefinitions(); // NEW: Get the dynamic list of navbar apps

  useEffect(() => {
    if (currentProjectPath) {
      setScriptsLoading(true);
      const loadScripts = async () => {
        try {
          const { scripts, packageManager: detectedPackageManager } =
            await fetchProjectScripts(currentProjectPath);
          setPackageScripts(scripts);
          setPackageManager(detectedPackageManager);
        } finally {
          setScriptsLoading(false);
        }
      };
      loadScripts();
    } else {
      setPackageScripts([]);
      setPackageManager(null);
      setScriptExecutionStatus({});
    }
  }, [currentProjectPath]);

  const onLogout = async () => {
    await handleLogout();
    navigate('/login');
    handleProfileMenuClose();
  };

  const notify = (
    message: string,
    severity: 'success' | 'info' | 'warning' | 'error',
  ) => {
    setSnackbarState({ open: true, message, severity });
  };

  const handleRunScript = async (
    scriptName: string,
    rawScriptContent: string,
  ) => {
    if (!currentProjectPath) {
      notify('Error: Project root not set.', 'error');
      return;
    }

    const isAnyScriptRunning = Object.values(scriptExecutionStatus).some(
      (state) => state.status === ScriptStatus.RUNNING,
    );
    if (isAnyScriptRunning) {
      notify('Another script is already running. Please wait.', 'info');
      return;
    }

    const packageManagerPrefix = packageManager || 'npm';
    const commandToExecute = `${packageManagerPrefix} run ${scriptName}`;

    setScriptExecutionStatus((prev) => ({
      ...prev,
      [scriptName]: {
        status: ScriptStatus.RUNNING,
        message: 'Running...',
        output: null,
      },
    }));
    notify(`Running '${scriptName}' with ${packageManagerPrefix}...`, 'info');

    try {
      const result = await runTerminalCommand(
        commandToExecute,
        currentProjectPath,
      );
      if (result.exitCode === 0) {
        setScriptExecutionStatus((prev) => ({
          ...prev,
          [scriptName]: {
            status: ScriptStatus.SUCCESS,
            message: 'Successfully ran.',
            output: result,
          },
        }));
        notify(`'${scriptName}' executed successfully!`, 'success');
      } else {
        const errorMessage =
          result.stderr || `Command exited with code ${result.exitCode}.`;
        setScriptExecutionStatus((prev) => ({
          ...prev,
          [scriptName]: {
            status: ScriptStatus.ERROR,
            message: errorMessage,
            output: result,
          },
        }));
        notify(`Error running '${scriptName}': ${errorMessage}`, 'error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setScriptExecutionStatus((prev) => ({
        ...prev,
        [scriptName]: {
          status: ScriptStatus.ERROR,
          message: errorMessage,
          output: null,
        },
      }));
      notify(`Failed to run '${scriptName}': ${errorMessage}`, 'error');
    }
  };

  const handleScriptMenuClick = (e: React.MouseEvent<HTMLButtonElement>) =>
    setScriptMenuAnchorEl(e.currentTarget);
  const handleScriptMenuClose = () => setScriptMenuAnchorEl(null);
  const handleAppsMenuClick = (e: React.MouseEvent<HTMLButtonElement>) =>
    setAppsMenuAnchorEl(e.currentTarget);
  const handleAppsMenuClose = () => setAppsMenuAnchorEl(null);
  const handleProfileMenuClick = (e: React.MouseEvent<HTMLButtonElement>) =>
    setProfileMenuAnchorEl(e.currentTarget);
  const handleProfileMenuClose = () => setProfileMenuAnchorEl(null);

  const isAnyScriptRunning = Object.values(scriptExecutionStatus).some(
    (state) => state.status === ScriptStatus.RUNNING,
  );

  return (
    <>
      <AppBar
        elevation={0}
        position="sticky"
        sx={{
          top: 0,
          zIndex: 1100,
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {isAnyScriptRunning && (
          <Box sx={{ width: '100%', position: 'absolute', top: 0, left: 0 }}>
            <LinearProgress />
          </Box>
        )}
        <Toolbar
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mx: 'auto',
            width: '100%',
            py: 0,
            px: { xs: 1, sm: 1, lg: 1 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isLoggedIn && (
              <IconButton
                color="inherit"
                onClick={() => isLeftSidebarVisible.set(!$isLeftSidebarVisible)}
                aria-label="toggle left sidebar"
                sx={{ color: theme.palette.text.primary }}
                disabled={!isLoggedIn}
              >
                {$isLeftSidebarVisible ? (
                  <CodiconLayoutSidebarLeft />
                ) : (
                  <CodiconLayoutSidebarLeftOff />
                )}
              </IconButton>
            )}

            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                textDecoration: 'none',
                color: theme.palette.text.primary,
                fontWeight: 'bold',
              }}
            >
              {APP_NAME}
            </Typography>
            {isLoggedIn && (
              <Box class="flex items-center gap-2">
                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                  <Button
                    id="apps-menu-button"
                    aria-controls={isAppsMenuOpen ? 'apps-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={isAppsMenuOpen ? 'true' : undefined}
                    onClick={handleAppsMenuClick}
                    startIcon={<AppsIcon />}
                    endIcon={<KeyboardArrowDownIcon />}
                    sx={{
                      fontWeight: 'bold',
                      color: theme.palette.text.primary,
                    }}
                  >
                    Apps
                  </Button>
                  <Menu
                    id="apps-menu"
                    anchorEl={appsMenuAnchorEl}
                    open={isAppsMenuOpen}
                    onClose={handleAppsMenuClose}
                    MenuListProps={{ 'aria-labelledby': 'apps-menu-button' }}
                    PaperProps={{
                      sx: { bgcolor: theme.palette.background.paper, p: 0 },
                    }}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  >
                    <AppsMenuContent
                      apps={navbarApps}
                      onClose={handleAppsMenuClose}
                    />
                    <MenuItem
                      component={Link}
                      to="/apps"
                      onClick={handleAppsMenuClose}
                      sx={{
                        borderTop: `1px solid ${theme.palette.divider}`,
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: theme.palette.primary.main,
                        py: 1,
                        '&:hover': { bgcolor: theme.palette.action.hover },
                      }}
                    >
                      View All Apps
                    </MenuItem>
                  </Menu>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {scriptsLoading ? (
                    <CircularProgress
                      size={20}
                      sx={{ color: theme.palette.text.secondary }}
                    />
                  ) : (
                    <Button
                      id="run-scripts-button"
                      aria-controls={
                        isScriptMenuOpen ? 'run-scripts-menu' : undefined
                      }
                      aria-haspopup="true"
                      aria-expanded={isScriptMenuOpen ? 'true' : undefined}
                      onClick={handleScriptMenuClick}
                      variant="text"
                      color="inherit"
                      size="small"
                      disabled={
                        !currentProjectPath ||
                        packageScripts.length === 0 ||
                        isAnyScriptRunning
                      }
                      sx={{
                        color: theme.palette.text.primary,
                        '&:hover': { bgcolor: theme.palette.action.hover },
                        minWidth: 'auto',
                        px: 1,
                        py: 0.5,
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                        fontWeight: 'bold',
                      }}
                      startIcon={<TerminalIcon fontSize="small" />}
                      endIcon={<KeyboardArrowDownIcon fontSize="small" />}
                    >
                      Run Scripts
                    </Button>
                  )}
                  <Menu
                    id="run-scripts-menu"
                    anchorEl={scriptMenuAnchorEl}
                    open={isScriptMenuOpen}
                    onClose={handleScriptMenuClose}
                    MenuListProps={{ 'aria-labelledby': 'run-scripts-button' }}
                    PaperProps={{
                      sx: { bgcolor: theme.palette.background.paper },
                    }}
                  >
                    {packageScripts.length > 0 ? (
                      packageScripts.map((script) => (
                        <RunScriptMenuItem
                          key={script.name}
                          name={script.name}
                          command={script.script}
                          onClick={(name, content) => {
                            handleRunScript(name, content);
                            handleScriptMenuClose();
                          }}
                          status={
                            scriptExecutionStatus[script.name]?.status ||
                            ScriptStatus.IDLE
                          }
                          disabled={isAnyScriptRunning}
                        />
                      ))
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ p: 2 }}
                      >
                        No scripts found.
                      </Typography>
                    )}
                  </Menu>
                </Box>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ThemeToggle />

            {authLoading ? (
              <CircularProgress
                size={24}
                sx={{ color: theme.palette.text.primary }}
              />
            ) : isLoggedIn ? (
              <>
                <IconButton
                  id="profile-menu-button"
                  aria-controls={isProfileMenuOpen ? 'profile-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={isProfileMenuOpen ? 'true' : undefined}
                  onClick={handleProfileMenuClick}
                  color="inherit"
                  sx={{ p: 0, color: theme.palette.text.primary }}
                >
                  <AccountCircle sx={{ fontSize: 32 }} />
                  <KeyboardArrowDownIcon />
                </IconButton>
                <Menu
                  id="profile-menu"
                  anchorEl={profileMenuAnchorEl}
                  open={isProfileMenuOpen}
                  onClose={handleProfileMenuClose}
                  MenuListProps={{ 'aria-labelledby': 'profile-menu-button' }}
                  PaperProps={{
                    sx: { bgcolor: theme.palette.background.paper, p: 0 },
                  }}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <ProfileMenuContent
                    profileItems={profileMenuDefinitions}
                    onClose={handleProfileMenuClose}
                    onLogout={onLogout}
                    user={user}
                  />
                </Menu>
                <IconButton
                  color="inherit"
                  onClick={() =>
                    isRightSidebarVisible.set(!$isRightSidebarVisible)
                  }
                  aria-label="toggle sidebar"
                  sx={{ color: theme.palette.text.primary }}
                >
                  {$isRightSidebarVisible ? (
                    <CodiconLayoutSidebarRight />
                  ) : (
                    <CodiconLayoutSidebarRightOff />
                  )}
                </IconButton>
              </>
            ) : (
              <>
                <Button
                  id="login-btn"
                  color="inherit"
                  component={Link}
                  to="/login"
                  sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
                >
                  Login
                </Button>
                <Button
                  color="inherit"
                  component={Link}
                  to="/register"
                  sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* ✅ Global MUI Snackbar controlled by aiEditorStore */}
      <Snackbar
        open={$snackbarState.open}
        autoHideDuration={4000}
        onClose={() => setSnackbarState({ ...$snackbarState, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarState({ ...$snackbarState, open: false })}
          severity={$snackbarState.severity}
          sx={{ width: '100%' }}
        >
          {$snackbarState.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Navbar;
