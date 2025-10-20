import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Alert,
  Typography,
} from '@mui/material';

interface CommitDialogProps {
  open: boolean;
  message: string;
  onMessageChange: (msg: string) => void;
  onCommit: () => Promise<void>;
  onClose: () => void;
  loading: boolean;
  disabled: boolean;
}

interface BranchDialogProps {
  open: boolean;
  name: string;
  onNameChange: (name: string) => void;
  onCreate: () => Promise<void>;
  onClose: () => void;
  loading: boolean;
  disabled: boolean;
}

interface CheckoutDialogProps {
  open: boolean;
  name: string;
  onNameChange: (name: string) => void;
  onCheckout: () => Promise<void>;
  onClose: () => void;
  loading: boolean;
  disabled: boolean;
}

interface RevertDialogProps {
  open: boolean;
  commitHash: string;
  onHashChange: (hash: string) => void;
  onRevert: () => Promise<void>;
  onClose: () => void;
  loading: boolean;
  disabled: boolean;
}

interface ResetHardDialogProps {
  open: boolean;
  commitHash: string;
  onReset: () => Promise<void>;
  onClose: () => void;
  loading: boolean;
  disabled: boolean;
}

interface CreateSnapshotDialogProps {
  open: boolean;
  name: string;
  onNameChange: (name: string) => void;
  onCreate: () => Promise<void>;
  onClose: () => void;
  loading: boolean;
  disabled: boolean;
}

interface DeleteSnapshotDialogProps {
  open: boolean;
  snapshotName: string | null;
  onDelete: () => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

interface GitDialogsProps {
  commitDialog: CommitDialogProps;
  branchDialog: BranchDialogProps;
  checkoutDialog: CheckoutDialogProps;
  revertDialog: RevertDialogProps;
  resetHardDialog: ResetHardDialogProps;
  createSnapshotDialog: CreateSnapshotDialogProps;
  deleteSnapshotDialog: DeleteSnapshotDialogProps;
}

export function GitDialogs({
  commitDialog,
  branchDialog,
  checkoutDialog,
  revertDialog,
  resetHardDialog,
  createSnapshotDialog,
  deleteSnapshotDialog,
}: GitDialogsProps) {
  return (
    <>
      {/* Commit Dialog */}
      <Dialog open={commitDialog.open} onClose={commitDialog.onClose} fullWidth maxWidth="sm">
        <DialogTitle>Commit Changes</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Commit Message"
            type="text"
            fullWidth
            variant="outlined"
            value={commitDialog.message}
            onChange={(e) => commitDialog.onMessageChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commitDialog.onCommit(); }}
            disabled={commitDialog.loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={commitDialog.onClose} disabled={commitDialog.loading}>Cancel</Button>
          <Button onClick={commitDialog.onCommit} disabled={commitDialog.disabled}>Commit</Button>
        </DialogActions>
      </Dialog>

      {/* Create New Branch Dialog */}
      <Dialog open={branchDialog.open} onClose={branchDialog.onClose} fullWidth maxWidth="sm">
        <DialogTitle>Create New Branch</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Branch Name"
            type="text"
            fullWidth
            variant="outlined"
            value={branchDialog.name}
            onChange={(e) => branchDialog.onNameChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') branchDialog.onCreate(); }}
            disabled={branchDialog.loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={branchDialog.onClose} disabled={branchDialog.loading}>Cancel</Button>
          <Button onClick={branchDialog.onCreate} disabled={branchDialog.disabled}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Checkout Branch Dialog */}
      <Dialog open={checkoutDialog.open} onClose={checkoutDialog.onClose} fullWidth maxWidth="sm">
        <DialogTitle>Checkout Branch</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Branch Name to Checkout"
            type="text"
            fullWidth
            variant="outlined"
            value={checkoutDialog.name}
            onChange={(e) => checkoutDialog.onNameChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') checkoutDialog.onCheckout(); }}
            disabled={checkoutDialog.loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={checkoutDialog.onClose} disabled={checkoutDialog.loading}>Cancel</Button>
          <Button onClick={checkoutDialog.onCheckout} disabled={checkoutDialog.disabled}>Checkout</Button>
        </DialogActions>
      </Dialog>

      {/* Revert Commit Dialog */}
      <Dialog open={revertDialog.open} onClose={revertDialog.onClose} fullWidth maxWidth="sm">
        <DialogTitle>Revert Commit</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Commit Hash to Revert"
            type="text"
            fullWidth
            variant="outlined"
            value={revertDialog.commitHash}
            onChange={(e) => revertDialog.onHashChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') revertDialog.onRevert(); }}
            disabled={revertDialog.loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={revertDialog.onClose} disabled={revertDialog.loading}>Cancel</Button>
          <Button onClick={revertDialog.onRevert} disabled={revertDialog.disabled}>Revert</Button>
        </DialogActions>
      </Dialog>

      {/* Git Reset Hard Dialog */}
      <Dialog open={resetHardDialog.open} onClose={resetHardDialog.onClose} fullWidth maxWidth="sm">
        <DialogTitle>Confirm Git Reset (Hard)</DialogTitle>
        <DialogContent>
          <Alert severity="error" className="mb-4">
            WARNING: This will discard ALL uncommitted changes AND force the repository to the state of commit \'{resetHardDialog.commitHash.substring(0, 7)}\'. This action is irreversible. Are you absolutely sure?
          </Alert>
          <TextField
            autoFocus
            margin="dense"
            label="Commit Hash (for confirmation)"
            type="text"
            fullWidth
            variant="outlined"
            value={resetHardDialog.commitHash}
            InputProps={{ readOnly: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={resetHardDialog.onClose} disabled={resetHardDialog.loading}>Cancel</Button>
          <Button onClick={resetHardDialog.onReset} color="error" disabled={resetHardDialog.disabled}>Reset Hard</Button>
        </DialogActions>
      </Dialog>

      {/* Create Repository Snapshot Dialog */}
      <Dialog open={createSnapshotDialog.open} onClose={createSnapshotDialog.onClose} fullWidth maxWidth="sm">
        <DialogTitle>Create Repository Snapshot</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Snapshot Name (e.g., 'pre-refactor')"
            type="text"
            fullWidth
            variant="outlined"
            value={createSnapshotDialog.name}
            onChange={(e) => createSnapshotDialog.onNameChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') createSnapshotDialog.onCreate(); }}
            disabled={createSnapshotDialog.loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={createSnapshotDialog.onClose} disabled={createSnapshotDialog.loading}>Cancel</Button>
          <Button onClick={createSnapshotDialog.onCreate} disabled={createSnapshotDialog.disabled}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Snapshot Dialog */}
      <Dialog open={deleteSnapshotDialog.open} onClose={deleteSnapshotDialog.onClose} fullWidth maxWidth="xs">
        <DialogTitle>Confirm Delete Snapshot</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete snapshot '<b>{deleteSnapshotDialog.snapshotName}</b>'? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteSnapshotDialog.onClose} disabled={deleteSnapshotDialog.loading}>Cancel</Button>
          <Button onClick={deleteSnapshotDialog.onDelete} color="error" disabled={deleteSnapshotDialog.loading}>Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
