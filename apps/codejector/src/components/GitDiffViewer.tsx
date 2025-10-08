import React, { useState, useCallback, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import CodeMirror from '@uiw/react-codemirror';
import { getCodeMirrorLanguage, createCodeMirrorTheme } from '@/utils/index';
import { diffLanguage } from '@/utils/diffLanguage';

import { oneDark } from '@codemirror/theme-one-dark';

import { themeStore } from '@/stores/themeStore';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface GitDiffViewerProps {
  /** Raw git diff text */
  diffContent: string;
  /** Optional label to display above diff */
  label?: string;
  /** Whether parent "View Code" panel is expanded */
  codeExpanded: boolean;
}

/**
 * GitDiffViewer
 *
 * - Displays a collapsible git diff section.
 * - Can only expand when `codeExpanded` is true.
 * - Automatically collapses when `codeExpanded` is false.
 */
export const GitDiffViewer: React.FC<GitDiffViewerProps> = ({
  diffContent,
  label = 'Git Diff',
  codeExpanded,
}) => {
  const muiTheme = useTheme();
  const { mode } = useStore(themeStore);
  const [isDiffExpanded, setIsDiffExpanded] = useState(false);

  const handleToggle = useCallback(
    (_e: React.SyntheticEvent, expanded: boolean) => {
      if (!codeExpanded) {
        // force collapse if parent View Code is not expanded
        setIsDiffExpanded(false);
        return;
      }
      setIsDiffExpanded(expanded);
    },
    [codeExpanded],
  );

  // Collapse automatically when parent collapses View Code
  useEffect(() => {
    if (!codeExpanded && isDiffExpanded) setIsDiffExpanded(false);
  }, [codeExpanded, isDiffExpanded]);

  if (!diffContent) return null;

  return (
    <Accordion
      sx={{ width: '100%', mt: 1 }}
      expanded={isDiffExpanded}
      onChange={handleToggle}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="body2" fontWeight="medium">
          {label}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box
          sx={{
            overflowX: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          }}
        >
          <CodeMirror
            value={diffContent}
            height={'200px'}
            extensions={[
              getCodeMirrorLanguage('test.tsx'),
              createCodeMirrorTheme(muiTheme),
              EditorView.lineWrapping,
            ]}
            theme={mode}
            editable={true}
          />
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};
