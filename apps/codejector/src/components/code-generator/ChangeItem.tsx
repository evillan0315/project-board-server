import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import {
  llmStore,
  setCurrentDiff,
  updateProposedChangeContent,
  updateProposedChangePath,
} from '@/stores/llmStore';
import { addLog } from '@/stores/logStore';
import { setError } from '@/stores/errorStore';
import { getGitDiff } from '@/api/llm';
import { FileChange } from '@/types';
import { truncateFilePath } from '@/utils/fileUtils';
import { CodeRepair } from '@/components/code-generator/utils/CodeRepair';
import { GitDiffViewer } from '@/components/GitDiffViewer';

import {
  Box,
  Typography,
  Button,
  Checkbox,
  Chip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  IconButton,
  TextField,
  InputAdornment,
  ListItem,
  ListItemText,
} from '@mui/material';
import { type SvgIconProps } from '@mui/material/SvgIcon';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit'; // Explicitly import EditIcon for editing
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import InsightsIcon from '@mui/icons-material/Insights';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import * as path from 'path-browserify';
import {
  getRelativePath,
} from '@/utils/index';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';

interface ChangeItemProps {
  index: number;
  change: FileChange;
  selected: boolean;
  onToggle: () => void;
}

const ACTION_COLOR: Record<
  FileChange['action'],
  'success' | 'primary' | 'warning' | 'info' | 'error'
> = {
  add: 'success',
  modify: 'primary',
  repair: 'warning',
  analyze: 'info',
  delete: 'error',
};

const ACTION_ICON: Record<
  FileChange['action'],
  React.ComponentType<SvgIconProps>
> = {
  add: AddCircleOutlineIcon,
  modify: EditIcon,
  repair: BuildCircleIcon,
  analyze: InsightsIcon,
  delete: DeleteOutlineIcon,
};

export const ChangeItem: React.FC<ChangeItemProps> = ({
  change,
  selected,
  onToggle,
}) => {
  const muiTheme = useTheme();
  const ActionIconComponent = ACTION_ICON[change.action]; // Renamed to avoid conflict

  const [isEditingFilePath, setIsEditingFilePath] = useState(false);
  const [editedFilePath, setEditedFilePath] = useState(change.filePath);
  const [codeMirrorValue, setCodeMirrorValue] = useState(
    change.newContent || '',
  );
  const [isCodeExpanded, setIsCodeExpanded] = useState(false);

  const { loading, currentDiff, diffFilePath, applyingChanges } = useStore(llmStore);
  const currentProjectPath = useStore(projectRootDirectoryStore);

  // Update editedFilePath if the actual change.filePath from store changes
  useEffect(() => {
    if (!isEditingFilePath) {
      setEditedFilePath(change.filePath);
    }
  }, [change.filePath, isEditingFilePath]);

  useEffect(() => {
    setCodeMirrorValue(change.newContent || '');
  }, [change.newContent]);

  const handleShowDiff = useCallback(async () => {
    if (!currentProjectPath) {
      const msg = 'Project root is not set. Please load a project first.';
      setError(msg);
      addLog('ChangeItem', msg, 'error', undefined, undefined, true);
      return;
    }

    setError(null);
    setCurrentDiff(null, null);
    addLog('ChangeItem', `Fetching git diff for ${change.filePath}...`, 'info');

    try {
      const relPath = getRelativePath(change.filePath, currentProjectPath);
      const diffContent = await (change.action === 'add'
        ? createAddDiff(change.newContent, relPath)
        : getGitDiff(relPath, currentProjectPath));

      setCurrentDiff(change.filePath, diffContent);
      addLog(
        'ChangeItem',
        `Git diff loaded for ${change.filePath}.`,
        'success',
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to get diff for ${change.filePath}: ${message}`);
      setCurrentDiff(change.filePath, `Error: ${message}`);
      addLog('ChangeItem', message, 'error', String(err), undefined, true);
    }
  }, [change, currentProjectPath]);

  const createAddDiff = (content: string, relPath: string): string =>
    `--- /dev/null\n+++ a/${relPath}\n@@ -0,0 +1,${content.split('\n').length} @@\n${content
      .split('\n')
      .map((line) => `+${line}`)
      .join('\n')}`;

  const commonDisabled = loading || applyingChanges;

  const handleSaveFilePath = () => {
    if (editedFilePath !== change.filePath) {
      updateProposedChangePath(change.filePath, editedFilePath);
    }
    setIsEditingFilePath(false);
  };

  const handleCancelEdit = () => {
    setEditedFilePath(change.filePath);
    setIsEditingFilePath(false);
    addLog('ChangeItem', `Cancelled edit for ${change.filePath}.`, 'info');
  };

  const handleCodeChange = useCallback(
    (value: string) => {
      setCodeMirrorValue(value);
      updateProposedChangeContent(change.filePath, value);
    },
    [change.filePath],
  );

  return (
    <ListItem alignItems="flex-start" sx={{ flexDirection: 'column', mb: 2 }}>
      <Box display="flex" alignItems="center" width="100%" gap={1}>
        <Checkbox checked={selected} onChange={onToggle} />

        {isEditingFilePath ? (
          <TextField
            variant="outlined"
            size="small"
            value={editedFilePath}
            onChange={(e) => setEditedFilePath(e.target.value)}
            onBlur={handleSaveFilePath}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveFilePath();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                handleCancelEdit();
              }
            }}
            disabled={commonDisabled}
            autoFocus
            fullWidth
            sx={{
              flexGrow: 1,
              mr: 1,
              '& .MuiOutlinedInput-root': { paddingRight: '0 !important' },
            }}
            InputProps={{
              style: {
                color: muiTheme.palette.text.primary,
                fontSize: '0.875rem',
                fontFamily: 'monospace',
              },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleSaveFilePath}
                    disabled={commonDisabled}
                  >
                    <SaveIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleCancelEdit}
                    disabled={commonDisabled}
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        ) : (
          <Typography
            variant="body1"
            sx={{
              fontFamily: 'monospace',
              flexGrow: 1,
              color: muiTheme.palette.text.primary,
              mr: 1,
            }}
          >
            {currentProjectPath
              ? truncateFilePath(path.join(currentProjectPath, change.filePath))
              : truncateFilePath(change.filePath)}
          </Typography>
        )}

        {!isEditingFilePath && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation(); // Prevent accordion collapse
              setIsEditingFilePath(true);
              addLog(
                'ChangeItem',
                `Started editing file path for: ${change.filePath}`,
                'debug',
              );
            }}
            disabled={commonDisabled}
            sx={{ color: muiTheme.palette.text.secondary }} // This icon is for editing the path
          >
            <EditIcon color="action" /> 
          </IconButton>
        )}
        <Chip
          label={change.action.toUpperCase()}
          color={ACTION_COLOR[change.action]}
          size="small"
          icon={<ActionIconComponent fontSize="small" />} // Use the specific action icon for the chip
        />
      </Box>

      {change.newContent && (
        <Box className="w-full">
          <Accordion
            sx={{ width: '100%', mt: 1 }}
            expanded={isCodeExpanded}
            onChange={(_, expanded) => setIsCodeExpanded(expanded)}
          >
            <AccordionSummary
              component="div" // 👈 prevents <button> nesting
              expandIcon={<ExpandMoreIcon />}
              onClick={handleShowDiff}
            >
              <Typography variant="body2" fontWeight="medium">
                View Code
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <CodeRepair
                value={codeMirrorValue}
                onChange={handleCodeChange}
                filePath={change.filePath}
                height={`180px`}
              />
            </AccordionDetails>
          </Accordion>

          <GitDiffViewer
            diffContent={
              diffFilePath === change.filePath ? currentDiff || '' : ''
            }
            label={`Git Diff for: ${diffFilePath}`}
            codeExpanded={isCodeExpanded}
          />
        </Box>
      )}

      <ListItemText
        secondary={
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {change.reason}
          </Typography>
        }
      />
    </ListItem>
  );
};
