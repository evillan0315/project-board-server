import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { gitStore } from '@/stores/gitStore';
import { GitCommit, GitBranch } from '@/types/git';
import {
  Box,
  Button,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import RunScriptMenuItem from '@/components/RunScriptMenuItem';
// import simpleGit from 'simple-git';

interface GitStatus {
  branch: string;
  modifiedFiles: string[];
  stagedFiles: string[];
}

// const git = simpleGit();

const SimpleGitPage = () => {
  const $git = useStore(gitStore);
  const [status, setStatus] = useState<GitStatus>({
    branch: 'main',
    modifiedFiles: [],
    stagedFiles: [],
  });
  const [commitMessage, setCommitMessage] = useState('');
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [newBranchName, setNewBranchName] = useState('');
  const [selectedFileToUndo, setSelectedFileToUndo] = useState<string | null>(
    null,
  );
  const [git, setGit] = useState<any>(null);

  useEffect(() => {
    let gitInstance: any = null;
    const getGitStatus = async () => {
      try {
        const simpleGit = (await import('simple-git')).default;
        gitInstance = simpleGit();

        const statusResult = await gitInstance.status();
        const branchResult = await gitInstance.branchLocal();
        const currentBranch = branchResult.current;
        const modifiedFiles = statusResult.modified;
        const stagedFiles = statusResult.staged;

        setStatus({
          branch: currentBranch || 'main',
          modifiedFiles: modifiedFiles,
          stagedFiles: stagedFiles,
        });

        const branchList = await gitInstance.branchLocal();
        const branches: GitBranch[] = Object.keys(branchList.branches).map(
          (branchName) => ({
            name: branchName,
            current: branchName === branchList.current,
          }),
        );
        setBranches(branches);
        setGit(gitInstance);
      } catch (error) {
        console.error('Failed to get git status:', error);
      }
    };

    getGitStatus();
    return () => {
      gitInstance = null;
    };
  }, []);

  const handleStage = async (file: string) => {
    if (!git) return;
    try {
      await git.add(file);
      console.log(`Staged ${file}`);
      // Refresh status after staging
      const statusResult = await git.status();
      setStatus((prevStatus) => ({
        ...prevStatus,
        modifiedFiles: statusResult.modified,
        stagedFiles: statusResult.staged,
      }));
    } catch (error) {
      console.error(`Failed to stage ${file}:`, error);
    }
  };

  const handleUnstage = async (file: string) => {
    if (!git) return;
    try {
      await git.reset(['--', file]);
      console.log(`Unstaged ${file}`);
      // Refresh status after unstaging
      const statusResult = await git.status();
      setStatus((prevStatus) => ({
        ...prevStatus,
        modifiedFiles: statusResult.modified,
        stagedFiles: statusResult.staged,
      }));
    } catch (error) {
      console.error(`Failed to unstage ${file}:`, error);
    }
  };

  const handleCommit = async () => {
    if (!git) return;
    try {
      await git.commit(commitMessage);
      console.log(`Committed with message: ${commitMessage}`);
      setCommitMessage('');

      // Refresh status after commit
      const statusResult = await git.status();
      setStatus((prevStatus) => ({
        ...prevStatus,
        modifiedFiles: statusResult.modified,
        stagedFiles: statusResult.staged,
      }));
    } catch (error) {
      console.error('Failed to commit:', error);
    }
  };

  const handleCreateBranch = async () => {
    if (!git) return;
    try {
      await git.checkoutLocalBranch(newBranchName);
      console.log(`Created branch: ${newBranchName}`);
      setNewBranchName('');
      // Refresh branches after create branch
      const branchList = await git.branchLocal();
      const branches: GitBranch[] = Object.keys(branchList.branches).map(
        (branchName) => ({
          name: branchName,
          current: branchName === branchList.current,
        }),
      );
      setBranches(branches);
    } catch (error) {
      console.error('Failed to create branch:', error);
    }
  };

  const handleCheckoutBranch = async (branchName: string) => {
    if (!git) return;
    try {
      await git.checkout(branchName);
      console.log(`Checked out branch: ${branchName}`);
      // Refresh status after checkout
      const statusResult = await git.status();
      const branchResult = await git.branchLocal();
      setStatus({
        branch: branchResult.current || 'main',
        modifiedFiles: statusResult.modified,
        stagedFiles: statusResult.staged,
      });
      // Refresh branches after checkout
      const branchList = await git.branchLocal();
      const branches: GitBranch[] = Object.keys(branchList.branches).map(
        (branchName) => ({
          name: branchName,
          current: branchName === branchList.current,
        }),
      );
      setBranches(branches);
    } catch (error) {
      console.error('Failed to checkout branch:', error);
    }
  };

  const handleRevertCommit = async () => {
    if (!git) return;
    try {
      // Get the latest commit hash
      const log = await git.log({ maxCount: 1 });
      const latestCommitHash = log.latest?.hash;

      if (latestCommitHash) {
        // Revert the latest commit
        await git.revert([latestCommitHash]);
        console.log(`Reverted commit: ${latestCommitHash}`);
        // Refresh status after revert commit
        const statusResult = await git.status();
        setStatus((prevStatus) => ({
          ...prevStatus,
          modifiedFiles: statusResult.modified,
          stagedFiles: statusResult.staged,
        }));
      } else {
        console.log('No commits to revert.');
      }
    } catch (error) {
      console.error('Failed to revert commit:', error);
    }
  };

  const handleUndoFileChanges = async (file: string) => {
    if (!git) return;
    try {
      await git.checkout(['--', file]);
      console.log(`Changes undone for ${file}`);
      // Refresh status after undo file changes
      const statusResult = await git.status();
      setStatus((prevStatus) => ({
        ...prevStatus,
        modifiedFiles: statusResult.modified,
        stagedFiles: statusResult.staged,
      }));
    } catch (error) {
      console.error(`Failed to undo changes for ${file}:`, error);
    }
  };

  const handleResetStagedChanges = async () => {
    if (!git) return;
    try {
      await git.reset();
      console.log('Staged changes have been reset.');
      // Refresh status after reset staged changes
      const statusResult = await git.status();
      setStatus((prevStatus) => ({
        ...prevStatus,
        modifiedFiles: statusResult.modified,
        stagedFiles: statusResult.staged,
      }));
    } catch (error) {
      console.error('Failed to reset staged changes:', error);
    }
  };

  return (
    <Box className="p-4">
      <Typography variant="h4" component="h1" className="mb-4">
        Simple Git
      </Typography>

      <Box className="mb-4">
        <Typography variant="h6">Status</Typography>
        <Typography>Current Branch: {status.branch}</Typography>

        <Box className="mt-2">
          <Typography variant="subtitle1">Modified Files:</Typography>
          <List>
            {status.modifiedFiles.map((file) => (
              <ListItem key={file}>
                <ListItemText primary={file} />
                <Button onClick={() => handleStage(file)}>Stage</Button>
                <Button onClick={() => handleUndoFileChanges(file)}>
                  Undo
                </Button>
              </ListItem>
            ))}
          </List>
        </Box>

        <Box className="mt-2">
          <Typography variant="subtitle1">Staged Files:</Typography>
          <List>
            {status.stagedFiles.map((file) => (
              <ListItem key={file}>
                <ListItemText primary={file} />
                <Button onClick={() => handleUnstage(file)}>Unstage</Button>
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>

      <Box className="mb-4">
        <Typography variant="h6">Reset Staged Changes</Typography>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleResetStagedChanges}
        >
          Reset Staged
        </Button>
      </Box>

      <Box className="mb-4">
        <Typography variant="h6">Commit</Typography>
        <TextField
          label="Commit Message"
          variant="outlined"
          fullWidth
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          className="mb-2"
        />
        <Button variant="contained" color="primary" onClick={handleCommit}>
          Commit
        </Button>
      </Box>

      <Box className="mb-4">
        <Typography variant="h6">Revert Commit</Typography>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleRevertCommit}
        >
          Revert Last Commit
        </Button>
      </Box>

      <Box className="mb-4">
        <Typography variant="h6">Branches</Typography>
        <List>
          {branches.map((branch) => (
            <ListItem key={branch.name}>
              <ListItemText
                primary={branch.name}
                secondary={branch.current ? 'Current' : ''}
              />
              <Button onClick={() => handleCheckoutBranch(branch.name)}>
                Checkout
              </Button>
            </ListItem>
          ))}
        </List>

        <TextField
          label="New Branch Name"
          variant="outlined"
          fullWidth
          value={newBranchName}
          onChange={(e) => setNewBranchName(e.target.value)}
          className="mb-2"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateBranch}
        >
          Create Branch
        </Button>
      </Box>

      <Divider className="my-4" />

      <Box className="mt-4">
        <Typography variant="h6">Run Script</Typography>
        <RunScriptMenuItem />
      </Box>
    </Box>
  );
};

export default SimpleGitPage;
