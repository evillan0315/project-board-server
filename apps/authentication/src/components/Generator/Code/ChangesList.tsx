import React, { useState } from 'react';
import {
  Box,
  Button,
  Divider,
  List,
  Stack,
  Paper
} from '@mui/material';
import { ChangeItem, type ChangeEntry } from './ChangeItem';

interface Props {
  changes: ChangeEntry[];
}

export const ChangesList: React.FC<Props> = ({ changes }) => {
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

  const toggleSelection = (filePath: string) => {
    setSelectedPaths(prev =>
      prev.includes(filePath)
        ? prev.filter(x => x !== filePath)
        : [...prev, filePath]
    );
  };

  const selectAll = () => setSelectedPaths(changes.map(c => c.filePath));
  const deselectAll = () => setSelectedPaths([]);
  const applySelected = () => {
    // Replace with actual apply logic
    console.log('Applying changes for selectedPaths:', selectedPaths);
  };

  return (
    <Box>
      {/* Sticky action bar */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          p: 1,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Button variant="contained" color="primary" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outlined" onClick={deselectAll}>
            Deselect All
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={applySelected}
            disabled={selectedPaths.length === 0}
          >
            Apply Selected Changes ({selectedPaths.length})
          </Button>
        </Stack>
      </Box>

      <Divider />

      {/* Scrollable list with elevation */}
      <Paper
        elevation={3}
        sx={{
          maxHeight: 500,
          overflowY: 'auto',
          pr: 1,
          mt: 1
        }}
      >
        <List disablePadding>
          {changes.map((change, index) => (
            <ChangeItem
              key={change.filePath}
              index={index}
              change={change}
              selected={selectedPaths.includes(change.filePath)}
              onToggle={() => toggleSelection(change.filePath)}
            />
          ))}
        </List>
      </Paper>
    </Box>
  );
};