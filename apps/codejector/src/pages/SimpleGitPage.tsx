import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Tooltip,
  Tabs,
  Tab,
  Menu,
  MenuItem,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CommitIcon from '@mui/icons-material/Commit';
import GitBranchIcon from '@mui/icons-material/CallSplit';
import HistoryIcon from '@mui/icons-material/History';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import SaveIcon from '@mui/icons-material/Save';
import CodeIcon from '@mui/icons-material/Code';
import UndoIcon from '@mui/icons-material/Undo'; // Added missing import

import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';
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
  gitRevertCommit
} from '@/api/git';
import { getGitDiff } from '@/api/llm';

import {
  gitStore,
  GitBranch,
  GitCommit,
  GitStatusResult,
} from '@/stores/gitStore'; // Removed setLoading, will use gitStore.setKey directly
import { projectStore } from '@/stores/projectStore';

import { showGlobalSnackbar } from '@/stores/snackbarStore';
import { themeStore } from '@/stores/themeStore';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';

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

const statusItemTextSx = {
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
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

export default function SimpleGitPage() {
  const theme = useTheme();
  const { mode } = useStore(themeStore);

  const projectRoot = useStore(projectRootDirectoryStore) || '/';

  const { status, branches, commits, snapshots, loading, error } = useStore(gitStore);

  const [commitMessage, setCommitMessage] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [checkoutBranchName, setCheckoutBranchName] = useState('');
  const [snapshotName, setSnapshotName] = useState('');
  const [revertCommitHash, setRevertCommitHash] = useState('');

  const [openCommitDialog, setOpenCommitDialog] = useState(false);
  const [openBranchDialog, setOpenBranchDialog] = useState(false);
  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false);
  const [openSnapshotDialog, setOpenSnapshotDialog] = useState(false);
  const [openRevertDialog, setOpenRevertDialog] = useState(false);
  const [openRestoreSnapshotDialog, setOpenRestoreSnapshotDialog] = useState(false);
  const [openDeleteSnapshotDialog, setOpenDeleteSnapshotDialog] = useState(false);
  const [snapshotToDelete, setSnapshotToDelete] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState(0);
  const [selectedStagedFiles, setSelectedStagedFiles] = useState<string[]>([]);
  const [selectedUnstagedFiles, setSelectedUnstagedFiles] = useState<string[]>([]);

  const [currentDiff, setCurrentDiff] = useState<string | null>(null);
  const [diffFilePath, setDiffFilePath] = useState<string | null>(null);
  const [openDiffViewer, setOpenDiffViewer] = useState(false);

  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; file: string } | null>(null);
  const [contextMenuBranch, setContextMenuBranch] = useState<{ mouseX: number; mouseY: number; branch: GitBranch } | null>(null);
  const [contextMenuCommit, setContextMenuCommit] = useState<{ mouseX: number; mouseY: number; commit: GitCommit } | null>(null);
  const [contextMenuSnapshot, setContextMenuSnapshot] = useState<{ mouseX: number; mouseY: number; snapshot: string } | null>(null);

  const fetchAllGitData = useCallback(async () => {
    if (!projectRoot) return;
    gitStore.setKey('loading', true); // Use gitStore.setKey for loading
    try {
      const [statusResult, branchesResult, commitsResult, snapshotsResult] = await Promise.all([
        getGitStatus(projectRoot),
        gitGetBranches(projectRoot),
        gitGetCommitLog(projectRoot),
        gitListSnapshots(projectRoot),
      ]);
      gitStore.set({ // Update multiple keys at once
        status: statusResult,
        branches: branchesResult,
        commits: commitsResult,
        snapshots: snapshotsResult.tags, // Correctly access .tags
        loading: false, // Ensure loading is reset
        error: null, // Clear any previous errors on successful fetch
      });
    } catch (err: any) {
      showGlobalSnackbar(
        `Failed to fetch Git data: ${err.message || 'Unknown error'}`, 'error'
      );
      gitStore.setKey('error', err.message || 'Unknown error'); // Set error in store
      gitStore.setKey('loading', false); // Ensure loading is reset
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
    console.log(status, 'status');
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
    gitStore.setKey('loading', true); // Use gitStore.setKey
    try {
      await gitStageFiles(files, projectRoot);
      showGlobalSnackbar('Files staged successfully', 'success');
      setSelectedUnstagedFiles([]);
      await getGitStatus(projectRoot); // Refresh status after action
    } catch (err: any) {
      showGlobalSnackbar(`Error staging files: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false); // Use gitStore.setKey
  };

  const handleUnstageSelected = async (filesToUnstage?: string[]) => {
    const files = filesToUnstage || selectedStagedFiles;
    if (files.length === 0 || !projectRoot) return;
    gitStore.setKey('loading', true); // Use gitStore.setKey
    try {
      await gitUnstageFiles(files, projectRoot);
      showGlobalSnackbar('Files unstaged successfully', 'success');
      setSelectedStagedFiles([]);
      await getGitStatus(projectRoot); // Refresh status after action
    } catch (err: any) {
      showGlobalSnackbar(`Error unstaging files: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false); // Use gitStore.setKey
  };

  const handleCommit = async () => {
    if (!commitMessage.trim() || !projectRoot) return;
    setOpenCommitDialog(false);
    gitStore.setKey('loading', true); // Use gitStore.setKey
    try {
      await gitCommit(commitMessage, projectRoot);
      showGlobalSnackbar('Changes committed successfully', 'success');
      setCommitMessage('');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error committing changes: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false); // Use gitStore.setKey
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim() || !projectRoot) return;
    setOpenBranchDialog(false);
    gitStore.setKey('loading', true); // Use gitStore.setKey
    try {
      await gitCreateBranch(newBranchName, projectRoot);
      showGlobalSnackbar(`Branch '${newBranchName}' created successfully`, 'success');
      setNewBranchName('');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error creating branch: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false); // Use gitStore.setKey
  };

  const handleCheckoutBranch = async () => {
    if (!checkoutBranchName.trim() || !projectRoot) return;
    setOpenCheckoutDialog(false);
    gitStore.setKey('loading', true); // Use gitStore.setKey
    try {
      await gitCheckoutBranch(checkoutBranchName, false, projectRoot);
      showGlobalSnackbar(`Checked out branch '${checkoutBranchName}'`, 'success');
      setCheckoutBranchName('');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error checking out branch: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false); // Use gitStore.setKey
  };

  const handleDeleteBranch = async (branchName: string, force: boolean = false) => {
    if (!branchName || !projectRoot) return;
    if (!window.confirm(`Are you sure you want to delete branch '${branchName}'? ${force ? '(Force delete)' : ''}`)) return;
    gitStore.setKey('loading', true); // Use gitStore.setKey
    try {
      await gitDeleteBranch(branchName, force, projectRoot);
      showGlobalSnackbar(`Branch '${branchName}' deleted successfully`, 'success');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error deleting branch: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false); // Use gitStore.setKey
  };

  const handleRevertCommit = async () => {
    if (!revertCommitHash.trim() || !projectRoot) return;
    setOpenRevertDialog(false);
    gitStore.setKey('loading', true); // Use gitStore.setKey
    try {
      await gitRevertCommit(revertCommitHash, projectRoot);
      showGlobalSnackbar(`Commit '${revertCommitHash}' reverted successfully`, 'success');
      setRevertCommitHash('');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error reverting commit: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false); // Use gitStore.setKey
  };

  const handleUndoFileChanges = async (filePath: string) => {
    if (!filePath || !projectRoot) return;
    if (!window.confirm(`Are you sure you want to discard changes in '${filePath}'? This cannot be undone.`)) return;
    gitStore.setKey('loading', true); // Use gitStore.setKey
    try {
      await gitUndoFileChanges(filePath, projectRoot);
      showGlobalSnackbar(`Changes in '${filePath}' discarded`, 'success');
      await getGitStatus(projectRoot); // Refresh status after action
    } catch (err: any) {
      showGlobalSnackbar(`Error discarding changes: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false); // Use gitStore.setKey
  };

  const handleCreateSnapshot = async () => {
    if (!snapshotName.trim() || !projectRoot) return;
    setOpenSnapshotDialog(false);
    gitStore.setKey('loading', true); // Use gitStore.setKey
    try {
      await gitCreateSnapshot(snapshotName, `Snapshot created by Codejector: ${snapshotName}`, projectRoot);
      showGlobalSnackbar(`Snapshot '${snapshotName}' created`, 'success');
      setSnapshotName('');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error creating snapshot: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false); // Use gitStore.setKey
  };

  const handleRestoreSnapshot = async (name: string) => {
    if (!name || !projectRoot) return;
    setOpenRestoreSnapshotDialog(false);
    if (!window.confirm(`Restoring snapshot '${name}' will revert your repository to that state. Are you sure?`)) return;
    gitStore.setKey('loading', true); // Use gitStore.setKey
    try {
      await gitRestoreSnapshot(name, projectRoot);
      showGlobalSnackbar(`Snapshot '${name}' restored`, 'success');
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error restoring snapshot: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false); // Use gitStore.setKey
  };

  const handleDeleteSnapshot = async () => {
    if (!snapshotToDelete || !projectRoot) return;
    setOpenDeleteSnapshotDialog(false);
    gitStore.setKey('loading', true); // Use gitStore.setKey
    try {
      await gitDeleteSnapshot(snapshotToDelete, projectRoot);
      showGlobalSnackbar(`Snapshot '${snapshotToDelete}' deleted`, 'success');
      setSnapshotToDelete(null);
      await fetchAllGitData();
    } catch (err: any) {
      showGlobalSnackbar(`Error deleting snapshot: ${err.message}`, 'error');
    }
    gitStore.setKey('loading', false); // Use gitStore.setKey
  };

  const handleViewDiff = async (filePath: string) => {
    if (!projectRoot) return;
    gitStore.setKey('loading', true); // Use gitStore.setKey
    try {
      const diffContent = await getGitDiff(filePath, projectRoot);
      setCurrentDiff(diffContent);
      setDiffFilePath(filePath);
      setOpenDiffViewer(true);
    } catch (err: any) {
      showGlobalSnackbar(`Error fetching diff: ${err.message}`, 'error');
    } finally {
      gitStore.setKey('loading', false); // Use gitStore.setKey
    }
  };

  const handleContextMenu = (event: React.MouseEvent, file: string) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6, file }
        : null,
    );
  };

  const handleContextMenuBranch = (event: React.MouseEvent, branch: GitBranch) => {
    event.preventDefault();
    setContextMenuBranch(
      contextMenuBranch === null
        ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6, branch }
        : null,
    );
  };

  const handleContextMenuCommit = (event: React.MouseEvent, commit: GitCommit) => {
    event.preventDefault();
    setContextMenuCommit(
      contextMenuCommit === null
        ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6, commit }
        : null,
    );
  };

  const handleContextMenuSnapshot = (event: React.MouseEvent, snapshot: string) => {
    event.preventDefault();
    setContextMenuSnapshot(
      contextMenuSnapshot === null
        ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6, snapshot }
        : null,
    );
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
    setContextMenuBranch(null);
    setContextMenuCommit(null);
    setContextMenuSnapshot(null);
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
          <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Staged Files */}
            <Paper sx={sectionPaperSx}>
              <Typography variant="h6" className="flex items-center gap-2 mb-2">Staged Changes <CheckCircleIcon color="success" fontSize="small" /></Typography>
              <List dense className="flex-grow overflow-auto border rounded-md border-gray-300 dark:border-gray-700">
                {status?.staged.length === 0 && <ListItem><ListItemText primary="No staged changes" /></ListItem>}
                {status?.staged.map((file) => (
                  <ListItem
                    key={file}
                    className={`${selectedStagedFiles.includes(file) ? 'bg-blue-100 dark:bg-blue-900' : ''} hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer`}
                    onClick={() => handleFileSelection(file, 'staged')}
                    onContextMenu={(e) => handleContextMenu(e, file)}
                  >
                    <ListItemIcon>
                      <RemoveIcon color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={file}
                      primaryTypographyProps={{ sx: statusItemTextSx }}
                    />
                  </ListItem>
                ))}
              </List>
              <Box className="flex justify-end gap-2 mt-2">
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<RemoveIcon />}
                  onClick={() => handleUnstageSelected()}
                  disabled={selectedStagedFiles.length === 0 || loading}
                >
                  Unstage Selected
                </Button>
              </Box>
            </Paper>

            {/* Unstaged Files */}
            <Paper sx={sectionPaperSx}>
              <Typography variant="h6" className="flex items-center gap-2 mb-2">Unstaged Changes <CancelIcon color="warning" fontSize="small" /></Typography>
              <List dense className="flex-grow overflow-auto border rounded-md border-gray-300 dark:border-gray-700">
                {status?.modified.length === 0 && status?.not_added.length === 0 && status?.deleted.length === 0 && <ListItem><ListItemText primary="No unstaged changes" /></ListItem>}
                {status?.modified.map((file) => (
                  <ListItem
                    key={file}
                    className={`${selectedUnstagedFiles.includes(file) ? 'bg-blue-100 dark:bg-blue-900' : ''} hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer`}
                    onClick={() => handleFileSelection(file, 'unstaged')}
                    onContextMenu={(e) => handleContextMenu(e, file)}
                  >
                    <ListItemIcon>
                      <DriveFileMoveIcon color="info" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${file} (Modified)`}
                      primaryTypographyProps={{ sx: statusItemTextSx }}
                    />
                  </ListItem>
                ))}
                {status?.not_added.map((file) => (
                  <ListItem
                    key={file}
                    className={`${selectedUnstagedFiles.includes(file) ? 'bg-blue-100 dark:bg-blue-900' : ''} hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer`}
                    onClick={() => handleFileSelection(file, 'unstaged')}
                    onContextMenu={(e) => handleContextMenu(e, file)}
                  >
                    <ListItemIcon>
                      <AddIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${file} (Untracked)`}
                      primaryTypographyProps={{ sx: statusItemTextSx }}
                    />
                  </ListItem>
                ))}
                {status?.deleted.map((file) => (
                  <ListItem
                    key={file.path} // Correctly access file.path
                    className={`${selectedUnstagedFiles.includes(file.path) ? 'bg-blue-100 dark:bg-blue-900' : ''} hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer`}
                    onClick={() => handleFileSelection(file.path, 'unstaged')}
                    onContextMenu={(e) => handleContextMenu(e, file.path)}
                  >
                    <ListItemIcon>
                      <DeleteForeverIcon color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${file.path} (Deleted)`}
                      primaryTypographyProps={{ sx: statusItemTextSx }}
                    />
                  </ListItem>
                ))}
              </List>
              <Box className="flex justify-end gap-2 mt-2">
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleStageSelected()}
                  disabled={selectedUnstagedFiles.length === 0 || loading}
                >
                  Stage Selected
                </Button>
              </Box>
            </Paper>
          </Box>
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={1}>
          <Box className="flex flex-col gap-4 mt-4">
            <Paper sx={sectionPaperSx}>
              <Box className="flex justify-between items-center mb-2">
                <Typography variant="h6">Branches</Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenBranchDialog(true)} disabled={loading}>
                  New Branch
                </Button>
              </Box>
              <List dense className="flex-grow overflow-auto border rounded-md border-gray-300 dark:border-gray-700">
                {branches.length === 0 && <ListItem><ListItemText primary="No branches found" /></ListItem>}
                {branches.map((branch) => (
                  <ListItem
                    key={branch.name}
                    className={`${branch.current ? 'bg-green-100 dark:bg-green-900' : ''} hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer`}
                    onContextMenu={(e) => handleContextMenuBranch(e, branch)}
                  >
                    <ListItemIcon>
                      <GitBranchIcon color={branch.current ? 'success' : 'action'} fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${branch.name}${branch.current ? ' (current)' : ''}`}
                      secondary={branch.commit}
                    />
                    {!branch.current && (
                      <Button size="small" onClick={() => { setCheckoutBranchName(branch.name); setOpenCheckoutDialog(true); }} disabled={loading}>
                        Checkout
                      </Button>
                    )}
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={2}>
          <Box className="flex flex-col gap-4 mt-4">
            <Paper sx={sectionPaperSx}>
              <Typography variant="h6" className="mb-2">Commit History</Typography>
              <List dense className="flex-grow overflow-auto border rounded-md border-gray-300 dark:border-gray-700">
                {commits.length === 0 && <ListItem><ListItemText primary="No commits found" /></ListItem>}
                {commits.map((commit) => ( // Directly map over commits array
                  <ListItem
                    key={commit.hash}
                    onContextMenu={(e) => handleContextMenuCommit(e, commit)}
                  >
                    <ListItemIcon>
                      <HistoryIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={commit.message}
                      secondary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={commit.hash.substring(0, 7)} size="small" />
                          <Typography variant="caption">{commit.author_name}</Typography>
                          <Typography variant="caption">{new Date(commit.date).toLocaleString()}</Typography>
                        </Box>
                      }
                    />
                    <Button size="small" onClick={() => { setRevertCommitHash(commit.hash); setOpenRevertDialog(true); }} disabled={loading}>
                      Revert
                    </Button>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={3}>
          <Box className="flex flex-col gap-4 mt-4">
            <Paper sx={sectionPaperSx}>
              <Box className="flex justify-between items-center mb-2">
                <Typography variant="h6">Snapshots</Typography>
                <Button variant="outlined" startIcon={<SaveIcon />} onClick={() => setOpenSnapshotDialog(true)} disabled={loading}>
                  Create Snapshot
                </Button>
              </Box>
              <List dense className="flex-grow overflow-auto border rounded-md border-gray-300 dark:border-gray-700">
                {snapshots.length === 0 && <ListItem><ListItemText primary="No snapshots found" /></ListItem>}
                {snapshots.map((snapshot) => (
                  <ListItem
                    key={snapshot}
                    onContextMenu={(e) => handleContextMenuSnapshot(e, snapshot)}
                  >
                    <ListItemIcon>
                      <BookmarkIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={snapshot} />
                    <Button size="small" color="primary" onClick={() => handleRestoreSnapshot(snapshot)} disabled={loading}>
                      Restore
                    </Button>
                    <Button size="small" color="error" onClick={() => { setSnapshotToDelete(snapshot); setOpenDeleteSnapshotDialog(true); }} disabled={loading}>
                      Delete
                    </Button>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        </CustomTabPanel>
      </Paper>

      {/* Context Menu for Files */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="point"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => { handleViewDiff(contextMenu?.file || ''); handleCloseContextMenu(); }} disabled={loading}>
          <ListItemIcon><CodeIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View Diff</ListItemText>
        </MenuItem>
        {status?.not_added.includes(contextMenu?.file || '') && ( // Only show stage if untracked or modified
          <MenuItem onClick={() => { handleStageSelected([contextMenu?.file || '']); handleCloseContextMenu(); }}>
            <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Stage File</ListItemText>
          </MenuItem>
        )}
        {status?.modified.includes(contextMenu?.file || '') && ( // Only show stage if untracked or modified
          <MenuItem onClick={() => { handleStageSelected([contextMenu?.file || '']); handleCloseContextMenu(); }}>
            <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Stage File</ListItemText>
          </MenuItem>
        )}
        {status?.staged.includes(contextMenu?.file || '') && (
          <MenuItem onClick={() => { handleUnstageSelected([contextMenu?.file || '']); handleCloseContextMenu(); }}>
            <ListItemIcon><RemoveIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Unstage File</ListItemText>
          </MenuItem>
        )}
        {(status?.modified.includes(contextMenu?.file || '') || status?.deleted.map(f => f.path).includes(contextMenu?.file || '')) && (
          <MenuItem onClick={() => { handleUndoFileChanges(contextMenu?.file || ''); handleCloseContextMenu(); }} disabled={loading}>
            <ListItemIcon><UndoIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Discard Changes</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Context Menu for Branches */}
      <Menu
        open={contextMenuBranch !== null}
        onClose={handleCloseContextMenu}
        anchorReference="point"
        anchorPosition={
          contextMenuBranch !== null
            ? { top: contextMenuBranch.mouseY, left: contextMenuBranch.mouseX }
            : undefined
        }
      >
        {!contextMenuBranch?.branch.current && (
          <MenuItem onClick={() => { setCheckoutBranchName(contextMenuBranch?.branch.name || ''); setOpenCheckoutDialog(true); handleCloseContextMenu(); }} disabled={loading}>
            <ListItemIcon><GitBranchIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Checkout</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => { handleDeleteBranch(contextMenuBranch?.branch.name || ''); handleCloseContextMenu(); }} disabled={loading}>
          <ListItemIcon><DeleteForeverIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Delete Branch</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleDeleteBranch(contextMenuBranch?.branch.name || '', true); handleCloseContextMenu(); }} disabled={loading}>
          <ListItemIcon><DeleteForeverIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Force Delete Branch</ListItemText>
        </MenuItem>
      </Menu>

      {/* Context Menu for Commits */}
      <Menu
        open={contextMenuCommit !== null}
        onClose={handleCloseContextMenu}
        anchorReference="point"
        anchorPosition={
          contextMenuCommit !== null
            ? { top: contextMenuCommit.mouseY, left: contextMenuCommit.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => { setRevertCommitHash(contextMenuCommit?.commit.hash || ''); setOpenRevertDialog(true); handleCloseContextMenu(); }} disabled={loading}>
          <ListItemIcon><RestoreIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Revert Commit</ListItemText>
        </MenuItem>
      </Menu>

      {/* Context Menu for Snapshots */}
      <Menu
        open={contextMenuSnapshot !== null}
        onClose={handleCloseContextMenu}
        anchorReference="point"
        anchorPosition={
          contextMenuSnapshot !== null
            ? { top: contextMenuSnapshot.mouseY, left: contextMenuSnapshot.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => { handleRestoreSnapshot(contextMenuSnapshot?.snapshot || ''); handleCloseContextMenu(); }} disabled={loading}>
          <ListItemIcon><RestoreIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Restore Snapshot</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setSnapshotToDelete(contextMenuSnapshot?.snapshot || null); setOpenDeleteSnapshotDialog(true); handleCloseContextMenu(); }} disabled={loading}>
          <ListItemIcon><DeleteForeverIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Delete Snapshot</ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <Dialog open={openCommitDialog} onClose={() => setOpenCommitDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Commit Changes</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Commit Message"
            type="text"
            fullWidth
            variant="outlined"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCommit(); }}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCommitDialog(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleCommit} disabled={!commitMessage.trim() || loading}>Commit</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openBranchDialog} onClose={() => setOpenBranchDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create New Branch</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Branch Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateBranch(); }}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBranchDialog(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleCreateBranch} disabled={!newBranchName.trim() || loading}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCheckoutDialog} onClose={() => setOpenCheckoutDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Checkout Branch</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Branch Name to Checkout"
            type="text"
            fullWidth
            variant="outlined"
            value={checkoutBranchName}
            onChange={(e) => setCheckoutBranchName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCheckoutBranch(); }}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCheckoutDialog(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleCheckoutBranch} disabled={!checkoutBranchName.trim() || loading}>Checkout</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openRevertDialog} onClose={() => setOpenRevertDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Revert Commit</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Commit Hash to Revert"
            type="text"
            fullWidth
            variant="outlined"
            value={revertCommitHash}
            onChange={(e) => setRevertCommitHash(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRevertCommit(); }}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRevertDialog(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleRevertCommit} disabled={!revertCommitHash.trim() || loading}>Revert</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openSnapshotDialog} onClose={() => setOpenSnapshotDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Repository Snapshot</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Snapshot Name (e.g., 'pre-refactor')"
            type="text"
            fullWidth
            variant="outlined"
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateSnapshot(); }}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSnapshotDialog(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleCreateSnapshot} disabled={!snapshotName.trim() || loading}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteSnapshotDialog} onClose={() => setOpenDeleteSnapshotDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>Confirm Delete Snapshot</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete snapshot '<b>{snapshotToDelete}</b>'? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteSnapshotDialog(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleDeleteSnapshot} color="error" disabled={loading}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDiffViewer} onClose={() => setOpenDiffViewer(false)} fullWidth maxWidth="md">
        <DialogTitle>Diff Viewer: {diffFilePath}</DialogTitle>
        <DialogContent className="p-0">
          <Box className="h-[60vh] w-full border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden">
            {currentDiff ? (
              <CodeMirrorEditor
                value={currentDiff}
                filePath={diffFilePath || 'diff.diff'}
                readOnly={true}
                height="100%"
                isDiffView={true}
              />
            ) : (
              <Box className="flex items-center justify-center h-full">
                <CircularProgress />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDiffViewer(false)} disabled={loading}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
