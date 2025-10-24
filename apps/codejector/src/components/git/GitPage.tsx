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
  Menu,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import CommitIcon from '@mui/icons-material/Commit';

import { getCodeMirrorLanguage } from '@/utils';
import {
  gitCommit,
  gitStageFiles,
  gitUnstageFiles,
  getGitStatus,
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

import { gitStore, GitBranch, GitCommit, GitStatusResult, GitResetHardDtoFrontend } from './types/git';
import { showGlobalSnackbar } from '@/stores/snackbarStore';
import { themeStore } from '@/stores/themeStore';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';

import { GitStatusSection } from './GitStatusSection';
import { GitBranchesSection } from './GitBranchesSection';
import { GitCommitsSection } from './GitCommitsSection';
import { GitSnapshotsSection } from './GitSnapshotsSection';
import { GitDialogs } from './GitDialogs';
import { GitDiffViewerDialog } from './GitDiffViewerDialog';
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

  const [commitMessage, setCommitMessage] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [checkoutBranchName, setCheckoutBranchName] = useState('');
  const [snapshotName, setSnapshotName] = useState('');
  const [revertCommitHash, setRevertCommitHash] = useState('');
  const [resetHardCommitHash, setResetHardCommitHash] = useState('');
  const [snapshotToDelete, setSnapshotToDelete] = useState<string | null>(null);

  const [openCommitDialog, setOpenCommitDialog] = useState(false);
  const [openBranchDialog, setOpenBranchDialog] = useState(false);
  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false);
  const [openSnapshotDialog, setOpenSnapshotDialog] = useState(false);
  const [openRevertDialog, setOpenRevertDialog] = useState(false);
  const [openResetHardDialog, setOpenResetHardDialog] = useState(false);
  const [openRestoreSnapshotDialog, setOpenRestoreSnapshotDialog] = useState(false);
  const [openDeleteSnapshotDialog, setOpenDeleteSnapshotDialog] = useState(false);

  const [activeTab, setActiveTab] = useState(0);
  const [selectedStagedFiles, setSelectedStagedFiles] = useState<string[]>([]);
  const [selectedUnstagedFiles, setSelectedUnstagedFiles] = useState<string[]>([]);

  const [currentDiff, setCurrentDiff] = useState<string | null>(null);
  const [diffFilePath, setDiffFilePath] = useState<string | null>(null);
  const [openDiffViewer, setOpenDiffViewer] = useState(false);

  const [fileContextMenu, setFileContextMenu] = useState<{ mouseX: number; mouseY: number; file: string } | null>(null);
  const [branchContextMenu, setBranchContextMenu] = useState<{ mouseX: number; mouseY: number; branch: GitBranch } | null>(null);
  const [commitMenuAnchorEl, setCommitMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [openCommitMenu, setOpenCommitMenu] = useState(false);
  const [selectedCommitForMenu, setSelectedCommitForMenu] = useState<GitCommit | null>(null);
  const [snapshotContextMenu, setSnapshotContextMenu] = useState<{ mouseX: number; mouseY: number; snapshot: string } | null>(null);

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
    }
    gitStore.setKey('loading', false);
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
    }
    gitStore.setKey('loading', false);
  };

  const handleCommit = async () => {
    if (!commitMessage.trim() || !projectRoot) return;
    setOpenCommitDialog(false);
    gitStore.setKey('loading', true);
    try {
      await gitCommit(commitMessage, projectRoot);
      showGlobalSnackbar('Changes committed successfully', 'success');
      setCommitMessage('');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error committing changes: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false);
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim() || !projectRoot) return;
    setOpenBranchDialog(false);
    gitStore.setKey('loading', true);
    try {
      await gitCreateBranch(newBranchName, projectRoot);
      showGlobalSnackbar(`Branch '${newBranchName}' created successfully`, 'success');
      setNewBranchName('');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error creating branch: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false);
  };

  const handleCheckoutBranch = async () => {
    if (!checkoutBranchName.trim() || !projectRoot) return;
    setOpenCheckoutDialog(false);
    gitStore.setKey('loading', true);
    try {
      await gitCheckoutBranch(checkoutBranchName, false, projectRoot);
      showGlobalSnackbar(`Checked out branch '${checkoutBranchName}'`, 'success');
      setCheckoutBranchName('');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error checking out branch: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false);
  };

  const handleDeleteBranch = async (branchName: string, force: boolean = false) => {
    if (!branchName || !projectRoot) return;
    if (!window.confirm(`Are you sure you want to delete branch '${branchName}'? ${force ? '(Force delete)' : ''}`)) return;
    gitStore.setKey('loading', true);
    try {
      await gitDeleteBranch(branchName, force, projectRoot);
      showGlobalSnackbar(`Branch '${branchName}' deleted successfully`, 'success');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error deleting branch: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false);
  };

  const handleRevertCommit = async () => {
    if (!revertCommitHash.trim() || !projectRoot) return;
    setOpenRevertDialog(false);
    gitStore.setKey('loading', true);
    try {
      await gitRevertCommit(revertCommitHash, projectRoot);
      showGlobalSnackbar(`Commit '${revertCommitHash}' reverted successfully`, 'success');
      setRevertCommitHash('');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error reverting commit: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false);
  };

  const handleGitResetHard = async () => {
    if (!resetHardCommitHash.trim() || !projectRoot) return;
    setOpenResetHardDialog(false);
    gitStore.setKey('loading', true);
    try {
      const dto: GitResetHardDtoFrontend = { commitHash: resetHardCommitHash, projectRoot };
      await gitResetHard(dto);
      showGlobalSnackbar(`Repository reset hard to commit '${resetHardCommitHash}'`, 'success');
      setResetHardCommitHash('');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error performing hard reset: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false);
  };

  const handleUndoFileChanges = async (filePath: string) => {
    if (!filePath || !projectRoot) return;
    if (!window.confirm(`Are you sure you want to discard changes in '${filePath}'? This cannot be undone.`)) return;
    gitStore.setKey('loading', true);
    try {
      await gitUndoFileChanges(filePath, projectRoot);
      showGlobalSnackbar(`Changes in '${filePath}' discarded`, 'success');
      await getGitStatus(projectRoot);
    } catch (err: any) {
      showGlobalSnackbar(`Error discarding changes: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false);
  };

  const handleCreateSnapshot = async () => {
    if (!snapshotName.trim() || !projectRoot) return;
    setOpenSnapshotDialog(false);
    gitStore.setKey('loading', true);
    try {
      await gitCreateSnapshot(snapshotName, `Snapshot created by Codejector: ${snapshotName}`, projectRoot);
      showGlobalSnackbar(`Snapshot '${snapshotName}' created`, 'success');
      setSnapshotName('');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error creating snapshot: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false);
  };

  const handleRestoreSnapshot = async (name: string) => {
    if (!name || !projectRoot) return;
    setOpenRestoreSnapshotDialog(false);
    if (!window.confirm(`Restoring snapshot '${name}' will revert your repository to that state. Are you sure?`)) return;
    gitStore.setKey('loading', true);
    try {
      await gitRestoreSnapshot(name, projectRoot);
      showGlobalSnackbar(`Snapshot '${name}' restored`, 'success');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error restoring snapshot: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false);
  };

  const handleDeleteSnapshot = async () => {
    if (!snapshotToDelete || !projectRoot) return;
    setOpenDeleteSnapshotDialog(false);
    gitStore.setKey('loading', true);
    try {
      await gitDeleteSnapshot(snapshotToDelete, projectRoot);
      showGlobalSnackbar(`Snapshot '${snapshotToDelete}' deleted`, 'success');
      setSnapshotToDelete(null);
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error deleting snapshot: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false);
  };

  const handleViewDiff = async (filePath: string) => {
    if (!projectRoot) return;
    gitStore.setKey('loading', true);
    try {
      const diffContent = await getGitDiff(filePath, projectRoot);
      setCurrentDiff(diffContent);
      setDiffFilePath(filePath);
      setOpenDiffViewer(true);
    } catch (err: any) {
      showGlobalSnackbar(`Error fetching diff: ${err.message}`, 'error');
    } finally {
      gitStore.setKey('loading', false);
    }
  };

  const handleFileContextMenu = (event: React.MouseEvent, file: string) => {
    event.preventDefault();
    setFileContextMenu(
      fileContextMenu === null
        ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6, file }
        : null,
    );
  };

  const handleBranchContextMenu = (event: React.MouseEvent, branch: GitBranch) => {
    event.preventDefault();
    setBranchContextMenu(
      branchContextMenu === null
        ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6, branch }
        : null,
    );
  };

  const handleCommitContextMenu = (event: React.MouseEvent, commit: GitCommit) => {
    event.preventDefault();
    setCommitMenuAnchorEl(event.currentTarget as HTMLElement);
    setSelectedCommitForMenu(commit);
    setOpenCommitMenu(true);
  };

  const handleSnapshotContextMenu = (event: React.MouseEvent, snapshot: string) => {
    event.preventDefault();
    setSnapshotContextMenu(
      snapshotContextMenu === null
        ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6, snapshot }
        : null,
    );
  };

  const handleCloseContextMenu = () => {
    setFileContextMenu(null);
    setBranchContextMenu(null);
    setSnapshotContextMenu(null);
    setOpenCommitMenu(false);
    setCommitMenuAnchorEl(null);
    setSelectedCommitForMenu(null);
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
        <Button variant="contained" startIcon={<CommitIcon />} onClick={() => setOpenCommitDialog(true)} disabled={status?.staged.length === 0 || loading}>
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
            onCreateBranchClick={() => setOpenBranchDialog(true)}
            onCheckoutBranch={(branchName) => { setCheckoutBranchName(branchName); setOpenCheckoutDialog(true); }}
            onBranchContextMenu={handleBranchContextMenu}
          />
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={2}>
          <GitCommitsSection
            commits={commits}
            loading={loading}
            onRevertCommit={(commitHash) => { setRevertCommitHash(commitHash); setOpenRevertDialog(true); }}
            onCommitContextMenu={handleCommitContextMenu}
          />
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={3}>
          <GitSnapshotsSection
            snapshots={snapshots}
            loading={loading}
            onCreateSnapshotClick={() => setOpenSnapshotDialog(true)}
            onRestoreSnapshot={handleRestoreSnapshot}
            onDeleteSnapshot={(snapshot) => { setSnapshotToDelete(snapshot); setOpenDeleteSnapshotDialog(true); }}
            onSnapshotContextMenu={handleSnapshotContextMenu}
          />
        </CustomTabPanel>
      </Paper>

      <GitFileContextMenu
        contextMenu={fileContextMenu}
        onClose={handleCloseContextMenu}
        loading={loading}
        status={status}
        onViewDiff={handleViewDiff}
        onStageFiles={handleStageSelected}
        onUnstageFiles={handleUnstageSelected}
        onDiscardChanges={handleUndoFileChanges}
      />

      <GitBranchContextMenu
        contextMenu={branchContextMenu}
        onClose={handleCloseContextMenu}
        loading={loading}
        onCheckoutBranch={(branchName) => { setCheckoutBranchName(branchName); setOpenCheckoutDialog(true); }}
        onDeleteBranch={handleDeleteBranch}
      />

      <GitCommitContextMenu
        anchorEl={commitMenuAnchorEl}
        open={openCommitMenu}
        onClose={handleCloseContextMenu}
        loading={loading}
        selectedCommit={selectedCommitForMenu}
        onRevertCommit={(commitHash) => {
          setRevertCommitHash(commitHash);
          setOpenRevertDialog(true);
          handleCloseContextMenu(); // Close the context menu after selecting an action
        }}
        onResetHard={(commitHash) => {
          setResetHardCommitHash(commitHash);
          setOpenResetHardDialog(true);
          handleCloseContextMenu(); // Close the context menu after selecting an action
        }}
      />

      <GitSnapshotContextMenu
        contextMenu={snapshotContextMenu}
        onClose={handleCloseContextMenu}
        loading={loading}
        onRestoreSnapshot={handleRestoreSnapshot}
        onDeleteSnapshot={(snapshot) => { setSnapshotToDelete(snapshot); setOpenDeleteSnapshotDialog(true); }}
      />

      <GitDialogs
        commitDialog={{
          open: openCommitDialog,
          message: commitMessage,
          onMessageChange: setCommitMessage,
          onCommit: handleCommit,
          onClose: () => setOpenCommitDialog(false),
          loading: loading,
          disabled: !commitMessage.trim() || loading
        }}
        branchDialog={{
          open: openBranchDialog,
          name: newBranchName,
          onNameChange: setNewBranchName,
          onCreate: handleCreateBranch,
          onClose: () => setOpenBranchDialog(false),
          loading: loading,
          disabled: !newBranchName.trim() || loading
        }}
        checkoutDialog={{
          open: openCheckoutDialog,
          name: checkoutBranchName,
          onNameChange: setCheckoutBranchName,
          onCheckout: handleCheckoutBranch,
          onClose: () => setOpenCheckoutDialog(false),
          loading: loading,
          disabled: !checkoutBranchName.trim() || loading
        }}
        revertDialog={{
          open: openRevertDialog,
          commitHash: revertCommitHash,
          onHashChange: setRevertCommitHash,
          onRevert: handleRevertCommit,
          onClose: () => setOpenRevertDialog(false),
          loading: loading,
          disabled: !revertCommitHash.trim() || loading
        }}
        resetHardDialog={{
          open: openResetHardDialog,
          commitHash: resetHardCommitHash,
          onReset: handleGitResetHard,
          onClose: () => setOpenResetHardDialog(false),
          loading: loading,
          disabled: !resetHardCommitHash.trim() || loading
        }}
        createSnapshotDialog={{
          open: openSnapshotDialog,
          name: snapshotName,
          onNameChange: setSnapshotName,
          onCreate: handleCreateSnapshot,
          onClose: () => setOpenSnapshotDialog(false),
          loading: loading,
          disabled: !snapshotName.trim() || loading
        }}
        deleteSnapshotDialog={{
          open: openDeleteSnapshotDialog,
          snapshotName: snapshotToDelete,
          onDelete: handleDeleteSnapshot,
          onClose: () => setOpenDeleteSnapshotDialog(false),
          loading: loading,
        }}
      />

      <GitDiffViewerDialog
        open={openDiffViewer}
        onClose={() => setOpenDiffViewer(false)}
        diffContent={currentDiff}
        filePath={diffFilePath}
        loading={loading}
        mode={mode}
      />
    </Box>
  );
}
