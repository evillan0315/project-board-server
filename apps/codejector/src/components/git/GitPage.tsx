import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  TextField,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import CommitIcon from '@mui/icons-material/Commit';

import {
  getGitStatus,
  gitCommit,
  gitStageFiles,
  gitUnstageFiles,
  gitGetBranches,
  gitCheckoutBranch,
  gitCreateBranch,
  gitDeleteBranch,
  gitGetCommitLog,
  gitCreateSnapshot,
  gitRestoreSnapshot,
  gitListSnapshots,
  gitDeleteSnapshot,
  gitUndoFileChanges,
  gitRevertCommit,
  gitResetHard,
  getGitDiff
} from './api/git';

import { IGitBranch, IGitCommit, IGitStatusResult, IGitResetHardDtoFrontend } from './types/git';
import { showGlobalSnackbar } from '@/stores/snackbarStore';
import { themeStore } from '@/stores/themeStore';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';
import { gitStore } from './stores/gitStore';
import { showDialog, hideDialog } from '@/stores/dialogStore';

import { GitStatusSection } from './GitStatusSection';
import { GitBranchesSection } from './GitBranchesSection';
import { GitCommitsSection } from './GitCommitsSection';
import { GitSnapshotsSection } from './GitSnapshotsSection';
import { GitDiffViewerContent } from './GitDiffViewerContent';
import { GitFileContextMenu } from './GitFileContextMenu';
import { GitBranchContextMenu } from './GitBranchContextMenu';
import { GitCommitContextMenu } from './GitCommitContextMenu';
import { GitSnapshotContextMenu } from './GitSnapshotContextMenu';

// Helper for consistent styling using MUI's sx prop
const sectionPaperSx = {
  p: 2,
  mb: 3,
  borderRadius: 2,
  backgroundColor: (theme: any) =>
    theme.palette.mode === 'dark' ? '#2c2c2c' : '#f0f0f0',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  minHeight: '200px',
  display: 'flex',
  flexDirection: 'column',
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      className="w-full"
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function GitPage() {
  const theme = useTheme();
  const { mode } = useStore(themeStore);

  const projectRoot = useStore(projectRootDirectoryStore) || '/';
  const { status, branches, commits, snapshots, loading, error } = useStore(gitStore);

  // Local states for dialog inputs
  const [commitMessage, setCommitMessage] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [checkoutBranchName, setCheckoutBranchName] = useState('');
  const [snapshotName, setSnapshotName] = useState('');
  const [revertCommitHash, setRevertCommitHash] = useState('');
  const [resetHardCommitHash, setResetHardCommitHash] = useState('');
  const [snapshotToDelete, setSnapshotToDelete] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState(0);
  const [selectedStagedFiles, setSelectedStagedFiles] = useState<string[]>([]);
  const [selectedUnstagedFiles, setSelectedUnstagedFiles] = useState<string[]>([]);

  // Context menu states
  const [fileMenuAnchorEl, setFileMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [openFileMenu, setOpenFileMenu] = useState(false);
  const [selectedFileForMenu, setSelectedFileForMenu] = useState<string | null>(null);

  const [branchMenuAnchorEl, setBranchMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [openBranchMenu, setOpenBranchMenu] = useState(false);
  const [selectedBranchForMenu, setSelectedBranchForMenu] = useState<IGitBranch | null>(null);

  const [commitMenuAnchorEl, setCommitMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [openCommitMenu, setOpenCommitMenu] = useState(false);
  const [selectedCommitForMenu, setSelectedCommitForMenu] = useState<IGitCommit | null>(null);

  const [snapshotMenuAnchorEl, setSnapshotMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [openSnapshotMenu, setOpenSnapshotMenu] = useState(false);
  const [selectedSnapshotForMenu, setSelectedSnapshotForMenu] = useState<string | null>(null);

  const fetchAllGitData = useCallback(async () => {
    if (!projectRoot) return;
    gitStore.setKey('loading', true);
    try {
      const [statusResult, branchesResult, commitsResult, snapshotsResult] = await Promise.all([
        getGitStatus(projectRoot),
        gitGetBranches(projectRoot),
        gitGetCommitLog(projectRoot),
        gitListSnapshots(projectRoot),
      ]);
      gitStore.set({
        status: statusResult,
        branches: branchesResult,
        commits: commitsResult,
        snapshots: snapshotsResult.tags,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      showGlobalSnackbar(
        `Failed to fetch Git data: ${err.message || 'Unknown error'}`, 'error'
      );
      gitStore.setKey('error', err.message || 'Unknown error');
      gitStore.setKey('loading', false);
    }
  }, [projectRoot]);

  useEffect(() => {
    fetchAllGitData();
  }, [fetchAllGitData]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    fetchAllGitData();
    showGlobalSnackbar('Git data refreshed', 'info');
  };

  const handleFileSelection = (filePath: string, type: 'staged' | 'unstaged') => {
    if (type === 'staged') {
      setSelectedStagedFiles((prev) =>
        prev.includes(filePath) ? prev.filter((f) => f !== filePath) : [...prev, filePath]
      );
    }
    if (type === 'unstaged') {
      setSelectedUnstagedFiles((prev) =>
        prev.includes(filePath) ? prev.filter((f) => f !== filePath) : [...prev, filePath]
      );
    }
  };

  const handleStageSelected = async (filesToStage?: string[]) => {
    const files = filesToStage || selectedUnstagedFiles;
    if (files.length === 0 || !projectRoot) return;
    gitStore.setKey('loading', true);
    try {
      await gitStageFiles(files, projectRoot);
      showGlobalSnackbar('Files staged successfully', 'success');
      setSelectedUnstagedFiles([]);
      await getGitStatus(projectRoot);
    } catch (err: any) {
      showGlobalSnackbar(`Error staging files: ${err.message}`, 'error');
    } finally {
      gitStore.setKey('loading', false);
    }
  };

  const handleUnstageSelected = async (filesToUnstage?: string[]) => {
    const files = filesToUnstage || selectedStagedFiles;
    if (files.length === 0 || !projectRoot) return;
    gitStore.setKey('loading', true);
    try {
      await gitUnstageFiles(files, projectRoot);
      showGlobalSnackbar('Files unstaged successfully', 'success');
      setSelectedStagedFiles([]);
      await getGitStatus(projectRoot);
    } catch (err: any) {
      showGlobalSnackbar(`Error unstaging files: ${err.message}`, 'error');
    } finally {
      gitStore.setKey('loading', false);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim() || !projectRoot) return;
    hideDialog(); // Close dialog before starting async operation
    gitStore.setKey('loading', true);
    try {
      await gitCommit(commitMessage, projectRoot);
      showGlobalSnackbar('Changes committed successfully', 'success');
      setCommitMessage('');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error committing changes: ${err.message}`, 'error');
    } finally {
      gitStore.setKey('loading', false);
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim() || !projectRoot) return;
    hideDialog();
    gitStore.setKey('loading', true);
    try {
      await gitCreateBranch(newBranchName, projectRoot);
      showGlobalSnackbar(`Branch '${newBranchName}' created successfully`, 'success');
      setNewBranchName('');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error creating branch: ${err.message}`, 'error');
    } finally {
      gitStore.setKey('loading', false);
    }
  };

  const handleCheckoutBranch = async () => {
    if (!checkoutBranchName.trim() || !projectRoot) return;
    hideDialog();
    gitStore.setKey('loading', true);
    try {
      await gitCheckoutBranch(checkoutBranchName, false, projectRoot);
      showGlobalSnackbar(`Checked out branch '${checkoutBranchName}'`, 'success');
      setCheckoutBranchName('');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error checking out branch: ${err.message}`, 'error');
    } finally {
      gitStore.setKey('loading', false);
    }
  };

  const handleDeleteBranch = async (branchName: string, force: boolean = false) => {
    if (!branchName || !projectRoot) return;
    hideDialog(); // Close confirm dialog
    gitStore.setKey('loading', true);
    try {
      await gitDeleteBranch(branchName, force, projectRoot);
      showGlobalSnackbar(`Branch '${branchName}' deleted successfully`, 'success');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error deleting branch: ${err.message}`, 'error');
    } finally {
      gitStore.setKey('loading', false);
    }
  };

  const handleRevertCommit = async () => {
    if (!revertCommitHash.trim() || !projectRoot) return;
    hideDialog();
    gitStore.setKey('loading', true);
    try {
      await gitRevertCommit(revertCommitHash, projectRoot);
      showGlobalSnackbar(`Commit '${revertCommitHash}' reverted successfully`, 'success');
      setRevertCommitHash('');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error reverting commit: ${err.message}`, 'error');
    } finally {
      gitStore.setKey('loading', false);
    }
  };

  const handleGitResetHard = async () => {
    if (!resetHardCommitHash.trim() || !projectRoot) return;
    hideDialog();
    gitStore.setKey('loading', true);
    try {
      const dto: IGitResetHardDtoFrontend = { commitHash: resetHardCommitHash, projectRoot };
      await gitResetHard(dto);
      showGlobalSnackbar(`Repository reset hard to commit '${resetHardCommitHash}'`, 'success');
      setResetHardCommitHash('');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error performing hard reset: ${err.message}`, 'error');
    } finally {
      gitStore.setKey('loading', false);
    }
  };

  const handleUndoFileChanges = async (filePath: string) => {
    if (!filePath || !projectRoot) return;
    hideDialog();
    gitStore.setKey('loading', true);
    try {
      await gitUndoFileChanges(filePath, projectRoot);
      showGlobalSnackbar(`Changes in '${filePath}' discarded`, 'success');
      await getGitStatus(projectRoot);
    } catch (err: any) {
      showGlobalSnackbar(`Error discarding changes: ${err.message}`, 'error');
    } finally {
      gitStore.setKey('loading', false);
    }
  };

  const handleCreateSnapshot = async () => {
    if (!snapshotName.trim() || !projectRoot) return;
    hideDialog();
    gitStore.setKey('loading', true);
    try {
      await gitCreateSnapshot(snapshotName, `Snapshot created by Codejector: ${snapshotName}`, projectRoot);
      showGlobalSnackbar(`Snapshot '${snapshotName}' created`, 'success');
      setSnapshotName('');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error creating snapshot: ${err.message}`, 'error');
    } finally {
      gitStore.setKey('loading', false);
    }
  };

  const handleRestoreSnapshot = async (name: string) => {
    if (!name || !projectRoot) return;
    hideDialog();
    gitStore.setKey('loading', true);
    try {
      await gitRestoreSnapshot(name, projectRoot);
      showGlobalSnackbar(`Snapshot '${name}' restored`, 'success');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error restoring snapshot: ${err.message}`, 'error');
    } finally {
      gitStore.setKey('loading', false);
    }
  };

  const handleDeleteSnapshot = async (snapshotName: string) => {
    if (!snapshotName || !projectRoot) return;
    hideDialog();
    gitStore.setKey('loading', true);
    try {
      await gitDeleteSnapshot(snapshotName, projectRoot);
      showGlobalSnackbar(`Snapshot '${snapshotName}' deleted`, 'success');
      setSnapshotToDelete(null);
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error deleting snapshot: ${err.message}`, 'error');
    } finally {
      gitStore.setKey('loading', false);
    }
  };

  const handleViewDiff = async (filePath: string) => {
    if (!projectRoot) return;
    gitStore.setKey('loading', true); // Start global loading
    let diffContent: string | null = null;

    try {
      diffContent = await getGitDiff(filePath, projectRoot);
    } catch (err: any) {
      showGlobalSnackbar(`Error fetching diff: ${err.message}`, 'error');
      gitStore.setKey('loading', false); // Stop loading on error
      return;
    }

    showDialog({
      title: `Diff Viewer: ${filePath}`,
      content: (
        <GitDiffViewerContent
          diffContent={diffContent}
          filePath={filePath}
          loading={false} // Content component itself is not loading anymore, global dialog is
        />
      ),
      maxWidth: 'md',
      fullWidth: true,
      showCloseButton: true,
      actions: (
        <Button onClick={hideDialog} disabled={loading}>Close</Button>
      ),
      onClose: () => {
        // This onClose is called when the dialog requests to close (e.g., escape key, backdrop click)
        // It should stop the loading indicator if it's still active from the diff fetch.
        gitStore.setKey('loading', false);
      }
    });
    // The loading for the initial fetch is already handled by gitStore.setKey('loading', true) at the start
    // The dialog's content itself will not show a loading spinner, as the content is only rendered after diffContent is available.
    // gitStore.setKey('loading', false); // Turn off loading once dialog is shown with content -- no need, as it's handled in the onClose of showDialog for consistency
  };

  // Dialog opener functions
  const handleOpenCommitDialog = () => {
    showDialog({
      title: 'Commit Changes',
      content: (
        <Box className="p-4">
        <TextField
          autoFocus
          margin="dense"
          label="Commit Message"
          type="text"
          fullWidth
          variant="outlined"
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !loading && commitMessage.trim()) handleCommit(); }}
          disabled={loading}
        />
        </Box>
      ),
      actions: (
        <>
          <Button onClick={hideDialog} disabled={loading}>Cancel</Button>
          <Button onClick={handleCommit} disabled={!commitMessage.trim() || loading}>Commit</Button>
        </>
      ),
      onClose: () => setCommitMessage(''), // Reset message on close
      showCloseButton: true,
    });
  };

  const handleOpenBranchDialog = () => {
    showDialog({
      title: 'Create New Branch',
      content: (
         <Box className="p-4">
        <TextField
          autoFocus
          margin="dense"
          label="New Branch Name"
          type="text"
          fullWidth
          variant="outlined"
          value={newBranchName}
          onChange={(e) => setNewBranchName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !loading && newBranchName.trim()) handleCreateBranch(); }}
          disabled={loading}
        />
         </Box>
      ),
      actions: (
        <>
          <Button onClick={hideDialog} disabled={loading}>Cancel</Button>
          <Button onClick={handleCreateBranch} disabled={!newBranchName.trim() || loading}>Create</Button>
        </>
      ),
      onClose: () => setNewBranchName(''),
      showCloseButton: true,
    });
  };

  const handleOpenCheckoutDialog = (branchName: string | null = null) => {
    if (branchName) setCheckoutBranchName(branchName); // Pre-fill if called from context menu
    showDialog({
      title: 'Checkout Branch',
      content: (
         <Box className="p-4">
        <TextField
          autoFocus
          margin="dense"
          label="Branch Name to Checkout"
          type="text"
          fullWidth
          variant="outlined"
          value={branchName || checkoutBranchName} // Use passed name or current state
          onChange={(e) => setCheckoutBranchName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !loading && (branchName || checkoutBranchName).trim()) handleCheckoutBranch(); }}
          disabled={loading}
        />
         </Box>
      ),
      actions: (
        <>
          <Button onClick={hideDialog} disabled={loading}>Cancel</Button>
          <Button onClick={handleCheckoutBranch} disabled={!(branchName || checkoutBranchName).trim() || loading}>Checkout</Button>
        </>
      ),
      onClose: () => setCheckoutBranchName(''),
      showCloseButton: true,
    });
  };

  const handleOpenDeleteBranchConfirmDialog = (branchName: string, force: boolean = false) => {
    showDialog({
      title: `Confirm Delete Branch: ${branchName}`,
      content: (
         <Box className="p-4">
        <Typography>
          Are you sure you want to delete branch '<b>{branchName}</b>'? {force ? '(Force delete - irreversible if unmerged)' : ''} This cannot be undone.
        </Typography>
         </Box>
      ),
      actions: (
        <>
          <Button onClick={hideDialog} disabled={loading}>Cancel</Button>
          <Button onClick={() => handleDeleteBranch(branchName, force)} color="error" disabled={loading}>
            Delete {force ? 'Force' : ''}
          </Button>
        </>
      ),
      showCloseButton: true,
      maxWidth: 'xs',
    });
  };

  const handleOpenRevertDialog = (commitHash: string | null = null) => {
    if (commitHash) setRevertCommitHash(commitHash);
    showDialog({
      title: 'Revert Commit',
      content: (
         <Box className="p-4">
        <TextField
          autoFocus
          margin="dense"
          label="Commit Hash to Revert"
          type="text"
          fullWidth
          variant="outlined"
          value={commitHash || revertCommitHash}
          onChange={(e) => setRevertCommitHash(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !loading && (commitHash || revertCommitHash).trim()) handleRevertCommit(); }}
          disabled={loading}
        />
         </Box>
      ),
      actions: (
        <>
          <Button onClick={hideDialog} disabled={loading}>Cancel</Button>
          <Button onClick={handleRevertCommit} disabled={!(commitHash || revertCommitHash).trim() || loading}>Revert</Button>
        </>
      ),
      onClose: () => setRevertCommitHash(''),
      showCloseButton: true,
    });
  };

  const handleOpenResetHardDialog = (commitHash: string | null = null) => {
    if (commitHash) setResetHardCommitHash(commitHash);
    showDialog({
      title: 'Confirm Git Reset (Hard)',
      content: (
         <Box className="p-4">
          <Alert severity="error" className="mb-4">
            WARNING: This will discard ALL uncommitted changes AND force the repository to the state of commit '{ (commitHash || resetHardCommitHash).substring(0, 7) }'. This action is irreversible. Are you absolutely sure?
          </Alert>
          <TextField
            margin="dense"
            label="Commit Hash (for confirmation)"
            type="text"
            fullWidth
            variant="outlined"
            value={commitHash || resetHardCommitHash}
            InputProps={{ readOnly: true }}
            disabled={loading}
          />
        </Box>
      ),
      actions: (
        <>
          <Button onClick={hideDialog} disabled={loading}>Cancel</Button>
          <Button onClick={handleGitResetHard} color="error" disabled={!(commitHash || resetHardCommitHash).trim() || loading}>Reset Hard</Button>
        </>
      ),
      onClose: () => setResetHardCommitHash(''),
      showCloseButton: true,
    });
  };

  const handleOpenDiscardChangesConfirmDialog = (filePath: string) => {
    showDialog({
      title: `Confirm Discard Changes`,
      content: (
         <Box className="p-4">
        <Typography>
          Are you sure you want to discard changes in '<b>{filePath}</b>'? This cannot be undone.
        </Typography>
         </Box>
      ),
      actions: (
        <>
          <Button onClick={hideDialog} disabled={loading}>Cancel</Button>
          <Button onClick={() => handleUndoFileChanges(filePath)} color="error" disabled={loading}>
            Discard
          </Button>
        </>
      ),
      showCloseButton: true,
      maxWidth: 'xs',
    });
  };

  const handleOpenCreateSnapshotDialog = () => {
    showDialog({
      title: 'Create Repository Snapshot',
      content: (
         <Box className="p-4">
        <TextField
          autoFocus
          margin="dense"
          label="Snapshot Name (e.g., 'pre-refactor')"
          type="text"
          fullWidth
          variant="outlined"
          value={snapshotName}
          onChange={(e) => setSnapshotName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !loading && snapshotName.trim()) handleCreateSnapshot(); }}
          disabled={loading}
        />
         </Box>
      ),
      actions: (
        <>
          <Button onClick={hideDialog} disabled={loading}>Cancel</Button>
          <Button onClick={handleCreateSnapshot} disabled={!snapshotName.trim() || loading}>Create</Button>
        </>
      ),
      onClose: () => setSnapshotName(''),
      showCloseButton: true,
    });
  };

  const handleOpenRestoreSnapshotConfirmDialog = (name: string) => {
    showDialog({
      title: `Confirm Restore Snapshot: ${name}`,
      content: (
         <Box className="p-4">
        <Typography>
          Restoring snapshot '<b>{name}</b>' will revert your repository to that state. Are you sure?
        </Typography>
         </Box>
      ),
      actions: (
        <>
          <Button onClick={hideDialog} disabled={loading}>Cancel</Button>
          <Button onClick={() => handleRestoreSnapshot(name)} color="error" disabled={loading}>
            Restore
          </Button>
        </>
      ),
      showCloseButton: true,
      maxWidth: 'xs',
    });
  };

  const handleOpenDeleteSnapshotConfirmDialog = (snapshot: string) => {
    // setSnapshotToDelete(snapshot); // State for snapshotToDelete is not explicitly needed here, direct passing is fine.
    showDialog({
      title: 'Confirm Delete Snapshot',
      content: (
         <Box className="p-4">
        <Typography>Are you sure you want to delete snapshot '<b>{snapshot}</b>'? This cannot be undone.</Typography>
         </Box>
      ),
      actions: (
        <>
          <Button onClick={hideDialog} disabled={loading}>Cancel</Button>
          <Button onClick={() => handleDeleteSnapshot(snapshot)} color="error" disabled={loading}>Delete</Button>
        </>
      ),
      onClose: () => setSnapshotToDelete(null),
      showCloseButton: true,
      maxWidth: 'xs',
    });
  };


  const handleFileContextMenu = (event: React.MouseEvent, file: string) => {
    event.preventDefault();
    setFileMenuAnchorEl(event.currentTarget as HTMLElement);
    setSelectedFileForMenu(file);
    setOpenFileMenu(true);
  };

  const handleBranchContextMenu = (event: React.MouseEvent, branch: IGitBranch) => {
    event.preventDefault();
    setBranchMenuAnchorEl(event.currentTarget as HTMLElement);
    setSelectedBranchForMenu(branch);
    setOpenBranchMenu(true);
  };

  const handleCommitContextMenu = (event: React.MouseEvent, commit: IGitCommit) => {
    event.preventDefault();
    setCommitMenuAnchorEl(event.currentTarget as HTMLElement);
    setSelectedCommitForMenu(commit);
    setOpenCommitMenu(true);
  };

  const handleSnapshotContextMenu = (event: React.MouseEvent, snapshot: string) => {
    event.preventDefault();
    setSnapshotMenuAnchorEl(event.currentTarget as HTMLElement);
    setSelectedSnapshotForMenu(snapshot);
    setOpenSnapshotMenu(true);
  };

  const handleCloseContextMenu = () => {
    setFileMenuAnchorEl(null);
    setOpenFileMenu(false);
    setSelectedFileForMenu(null);

    setBranchMenuAnchorEl(null);
    setOpenBranchMenu(false);
    setSelectedBranchForMenu(null);

    setCommitMenuAnchorEl(null);
    setOpenCommitMenu(false);
    setSelectedCommitForMenu(null);

    setSnapshotMenuAnchorEl(null);
    setOpenSnapshotMenu(false);
    setSelectedSnapshotForMenu(null);
  };

  if (!projectRoot || projectRoot === '/') {
    return (
      <Box className="p-4 flex flex-col items-center justify-center h-full">
        <Alert severity="info" className="mb-4">No project root directory selected. Please select a project to view Git status.</Alert>
        <Typography variant="h6">Go to the 'AI Editor' page to select a project.</Typography>
      </Box>
    );
  }

  return (
    <Box className="p-4 flex flex-col h-full bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100">
      <Typography variant="h4" component="h1" className="mb-4 font-bold text-center">Git Version Control</Typography>
      <Typography variant="subtitle1" className="mb-4 text-center">Project Root: {projectRoot}</Typography>

      {loading && (
        <Box className="flex items-center justify-center p-4">
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography>Loading Git data...</Typography>
        </Box>
      )}
      {error && (
        <Alert severity="error" className="mb-4">{error}</Alert>
      )}

      <Box className="flex justify-between items-center mb-4">
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={handleRefresh}>
          Refresh Git Data
        </Button>
        <Button variant="contained" startIcon={<CommitIcon />} onClick={handleOpenCommitDialog} disabled={status?.staged.length === 0 || loading}>
          Commit Staged
        </Button>
      </Box>

      <Paper sx={sectionPaperSx} className="flex-grow overflow-auto">
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="git tabs" textColor="primary" indicatorColor="primary">
            <Tab label="Status" {...a11yProps(0)} />
            <Tab label="Branches" {...a11yProps(1)} />
            <Tab label="Commits" {...a11yProps(2)} />
            <Tab label="Snapshots" {...a11yProps(3)} />
          </Tabs>
        </Box>

        <CustomTabPanel value={activeTab} index={0}>
          <GitStatusSection
            status={status}
            loading={loading}
            selectedStagedFiles={selectedStagedFiles}
            setSelectedStagedFiles={setSelectedStagedFiles}
            selectedUnstagedFiles={selectedUnstagedFiles}
            setSelectedUnstagedFiles={setSelectedUnstagedFiles}
            onStageSelected={handleStageSelected}
            onUnstageSelected={handleUnstageSelected}
            onFileContextMenu={handleFileContextMenu}
          />
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={1}>
          <GitBranchesSection
            branches={branches}
            loading={loading}
            onCreateBranchClick={handleOpenBranchDialog}
            onCheckoutBranch={handleOpenCheckoutDialog}
            onBranchContextMenu={handleBranchContextMenu}
          />
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={2}>
          <GitCommitsSection
            commits={commits}
            loading={loading}
            onRevertCommit={handleOpenRevertDialog}
            onCommitContextMenu={handleCommitContextMenu}
          />
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={3}>
          <GitSnapshotsSection
            snapshots={snapshots}
            loading={loading}
            onCreateSnapshotClick={handleOpenCreateSnapshotDialog}
            onRestoreSnapshot={handleOpenRestoreSnapshotConfirmDialog}
            onDeleteSnapshot={handleOpenDeleteSnapshotConfirmDialog}
            onSnapshotContextMenu={handleSnapshotContextMenu}
          />
        </CustomTabPanel>
      </Paper>

      <GitFileContextMenu
        anchorEl={fileMenuAnchorEl}
        open={openFileMenu}
        onClose={handleCloseContextMenu}
        loading={loading}
        selectedFile={selectedFileForMenu}
        status={status}
        onViewDiff={handleViewDiff}
        onStageFiles={handleStageSelected}
        onUnstageFiles={handleUnstageSelected}
        onDiscardChanges={(filePath) => { handleOpenDiscardChangesConfirmDialog(filePath); handleCloseContextMenu(); }}
      />

      <GitBranchContextMenu
        anchorEl={branchMenuAnchorEl}
        open={openBranchMenu}
        onClose={handleCloseContextMenu}
        loading={loading}
        selectedBranch={selectedBranchForMenu}
        onCheckoutBranch={(branchName) => { handleOpenCheckoutDialog(branchName); handleCloseContextMenu(); }}
        onDeleteBranch={(branchName, force) => { handleOpenDeleteBranchConfirmDialog(branchName, force); handleCloseContextMenu(); }}
      />

      <GitCommitContextMenu
        anchorEl={commitMenuAnchorEl}
        open={openCommitMenu}
        onClose={handleCloseContextMenu}
        loading={loading}
        selectedCommit={selectedCommitForMenu}
        onRevertCommit={(commitHash) => {
          handleOpenRevertDialog(commitHash);
          handleCloseContextMenu(); // Close the context menu after selecting an action
        }}
        onResetHard={(commitHash) => {
          handleOpenResetHardDialog(commitHash);
          handleCloseContextMenu(); // Close the context menu after selecting an action
        }}
      />

      <GitSnapshotContextMenu
        anchorEl={snapshotMenuAnchorEl}
        open={openSnapshotMenu}
        onClose={handleCloseContextMenu}
        loading={loading}
        selectedSnapshot={selectedSnapshotForMenu}
        onRestoreSnapshot={(snapshot) => { handleOpenRestoreSnapshotConfirmDialog(snapshot); handleCloseContextMenu(); }}
        onDeleteSnapshot={(snapshot) => { handleOpenDeleteSnapshotConfirmDialog(snapshot); handleCloseContextMenu(); }} />

    </Box>
  );
}
