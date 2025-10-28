import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import BookmarkIcon from '@mui/icons-material/Bookmark';
// import RestoreIcon from '@mui/icons-material/Restore'; // No longer needed directly here
// import DeleteForeverIcon from '@mui/icons-material/DeleteForever'; // No longer needed directly here

interface GitSnapshotsSectionProps {
  snapshots: string[];
  loading: boolean;
  onCreateSnapshotClick: () => void;
  onRestoreSnapshot: (snapshotName: string) => void;
  onDeleteSnapshot: (snapshotName: string) => void;
  onSnapshotContextMenu: (event: React.MouseEvent, snapshot: string) => void;
}

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

export function GitSnapshotsSection({
  snapshots,
  loading,
  onCreateSnapshotClick,
  onRestoreSnapshot,
  onDeleteSnapshot,
  onSnapshotContextMenu,
}: GitSnapshotsSectionProps) {
  return (
    <Box className="flex flex-col gap-4 mt-4">
      <Paper sx={sectionPaperSx}>
        <Box className="flex justify-between items-center mb-2">
          <Typography variant="h6">Snapshots</Typography>
          <Button variant="outlined" startIcon={<SaveIcon />} onClick={onCreateSnapshotClick} disabled={loading}>
            Create Snapshot
          </Button>
        </Box>
        <List dense className="flex-grow overflow-auto border rounded-md border-gray-300 dark:border-gray-700">
          {snapshots.length === 0 && <ListItem><ListItemText primary="No snapshots found" /></ListItem>}
          {snapshots.map((snapshot) => (
            <ListItem
              key={snapshot}
              onContextMenu={(e) => onSnapshotContextMenu(e, snapshot)}
            >
              <ListItemIcon>
                <BookmarkIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={snapshot} />
              <Button size="small" color="primary" onClick={() => onRestoreSnapshot(snapshot)} disabled={loading}>
                Restore
              </Button>
              <Button size="small" color="error" onClick={() => onDeleteSnapshot(snapshot)} disabled={loading}>
                Delete
              </Button>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
