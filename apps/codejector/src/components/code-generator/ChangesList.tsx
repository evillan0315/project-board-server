import React, { useMemo, useCallback, useReducer } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  Button,
  List,
  Stack,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ChangeItem } from './ChangeItem';
import OutputLogger from '@/components/OutputLogger';
import { addLog } from '@/stores/logStore';
import {
  setError, // Still used for immediate, transient UI error
} from '@/stores/errorStore';
import {
  llmStore,
  deselectAllChanges,
  setApplyingChanges,
  setLastLlmResponse,
  clearDiff,
  performPostApplyActions,
} from '@/stores/llmStore';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';
import { FileChange } from '@/types/llm';

interface Props {
  changes: FileChange[];
}

// Define the state type
type ChangesListState = {
  selectedChanges: Record<string, FileChange>;
};

// Define the action type
type ChangesListAction = {
  type: 'SELECT_CHANGE' | 'DESELECT_CHANGE';
  change: FileChange;
};

// Reducer function to manage selected changes
const changesListReducer = (
  state: ChangesListState,
  action: ChangesListAction,
): ChangesListState => {
  switch (action.type) {
    case 'SELECT_CHANGE':
      return {
        ...state,
        selectedChanges: {
          ...state.selectedChanges,
          [action.change.filePath]: action.change,
        },
      };
    case 'DESELECT_CHANGE':
      const { [action.change.filePath]: _, ...rest } = state.selectedChanges;
      return {
        ...state,
        selectedChanges: rest,
      };
    default:
      return state;
  }
};

// Initial state for the reducer
const initialChangesListState: ChangesListState = {
  selectedChanges: {},
};

// Define the type for the apply result
interface ApplyResult {
  success: boolean;
  messages: string[];
}

export const ChangesList: React.FC<Props> = ({ changes }) => {
  const {
    lastLlmResponse,
    applyingChanges,
    gitInstructions,
    lastLlmGeneratePayload,
    scanPathsInput,
    isBuilding,
    error,
  } = useStore(llmStore);
  const currentProjectPath = useStore(projectRootDirectoryStore);

  // UseReducer hook for managing selected changes
  const [state, dispatch] = useReducer(
    changesListReducer,
    initialChangesListState,
  );
  const selectedChanges = state.selectedChanges;

  const handleApplySelectedChanges = async () => {
    if (Object.keys(selectedChanges).length === 0) {
      const msg = 'No changes selected to apply.';
      setError(msg);
      addLog('AI Response Display', msg, 'warning', undefined, undefined, true);
      return;
    }

    if (!currentProjectPath) {
      const msg = 'Project root is not set.';
      setError(msg);
      addLog('AI Response Display', msg, 'error', undefined, undefined, true);
      return;
    }

    if (!lastLlmGeneratePayload) {
      const msg =
        'Original AI generation payload missing. Cannot report errors.';
      setError(msg);
      addLog('AI Response Display', msg, 'error', undefined, undefined, true);
      return;
    }

    setApplyingChanges(true);
    setError(null);
    addLog(
      'AI Response Display',
      'Starting application process for selected changes...',
      'info',
    );

    try {
      const changesToApply = Object.values(selectedChanges);

      // Call your API or store action to apply changes
      const applyResult = (await performPostApplyActions(
        currentProjectPath,
        changesToApply,
        lastLlmGeneratePayload,
        lastLlmResponse || {},
      )) as ApplyResult; // Cast the result to ApplyResult

      // ApplyResult could have messages & success status
      if (applyResult) {
        if (applyResult.messages) {
          applyResult.messages.forEach((msg) =>
            addLog('AI Response Display', msg, 'info'),
          );
        }

        if (applyResult.success === false) {
          const msg = 'Some changes failed to apply. Check logs for details.';
          setError(msg);
          addLog(
            'AI Response Display',
            msg,
            'error',
            applyResult.messages.join('\n'),
            undefined,
            true,
          );
        } else {
          addLog(
            'AI Response Display',
            'Changes applied successfully.',
            'success',
          );

          // Perform post-apply actions like  git
          await performPostApplyActions(
            currentProjectPath,
            changesToApply,
            lastLlmGeneratePayload,
            lastLlmResponse || {},
          );
        }
      } else {
        console.warn('applyResult is undefined or null.');
      }

      // Clear state after successful apply
      setLastLlmResponse(null);
      deselectAllChanges();
      clearDiff();
    } catch (err) {
      const errorMsg = `Failure during application of changes: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMsg);
      addLog(
        'AI Response Display',
        errorMsg,
        'error',
        String(err),
        undefined,
        true,
      );
    } finally {
      setApplyingChanges(false);
    }
  };
  const isAnyProcessRunning = applyingChanges;

  // Memoize the ChangeItem component to prevent unnecessary re-renders
  const ChangeItemMemo = useMemo(() => ChangeItem, []);

  const toggleChange = useCallback(
    (change: FileChange) => {
      const isSelected = !!selectedChanges[change.filePath];

      dispatch({
        type: isSelected ? 'DESELECT_CHANGE' : 'SELECT_CHANGE',
        change: change,
      });
    },
    [selectedChanges, dispatch],
  );

  const handleSelectAllChanges = useCallback(() => {
    changes.forEach((change) => {
      if (!selectedChanges[change.filePath]) {
        dispatch({
          type: 'SELECT_CHANGE',
          change: change,
        });
      }
    });
  }, [changes, selectedChanges, dispatch]);

  const handleDeselectAllChanges = useCallback(() => {
    changes.forEach((change) => {
      if (selectedChanges[change.filePath]) {
        dispatch({
          type: 'DESELECT_CHANGE',
          change: change,
        });
      }
    });
  }, [changes, selectedChanges, dispatch]);

  if (!lastLlmResponse) return null;
  return (
    <Box>
      {/* Sticky action bar */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,

          p: 1,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            onClick={handleSelectAllChanges} // This action also logs
            disabled={isAnyProcessRunning}
          >
            Select All
          </Button>
          <Button
            variant="outlined"
            onClick={handleDeselectAllChanges} // This action also logs
            disabled={isAnyProcessRunning}
          >
            Deselect All
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleApplySelectedChanges}
            disabled={
              isAnyProcessRunning || Object.keys(selectedChanges).length === 0
            }
            startIcon={
              isAnyProcessRunning ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            {applyingChanges ? 'Applying...' : 'Apply Selected Changes'}
          </Button>
        </Stack>
      </Box>

      {applyingChanges && (
        <Alert severity="info" sx={{ mt: 3, flexShrink: 0 }}>
          {' '}
          {/* Added flexShrink */}
          Applying selected changes...
          <CircularProgress size={16} color="inherit" sx={{ ml: 1 }} />
        </Alert>
      )}


      <Paper
        elevation={3}
        sx={{
          maxHeight: 500,
          overflowY: 'auto',
          pr: 1,
          mt: 1,
        }}
      >
        <List disablePadding>
          {changes &&
            changes.map((change, index) => {
              const isSelected = !!selectedChanges[change.filePath];

              return (
                <ChangeItemMemo
                  key={change.filePath}
                  index={index}
                  change={change}
                  selected={isSelected}
                  onToggle={() => toggleChange(change)}
                />
              );
            })}
        </List>
      </Paper>
    </Box>
  );
};
