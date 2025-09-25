import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, TextField, Typography, IconButton, CircularProgress, Tooltip, Accordion, AccordionSummary, AccordionDetails, useTheme } from '@mui/material';
import {
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';


interface AIPromptEditorProps {}

const AIPromptEditor: React.FC<AIPromptEditorProps> = () => {
  const theme = useTheme();


  // ---- local state ----
  const [editorContent, setEditorContent] = useState('');
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);

  // ---- handlers ----
  const handleGenerateCode = useCallback(async () => {
    setLoading(true);
    try {

    } catch (err) {
      const msg = `Failed to generate code: ${err instanceof Error ? err.message : String(err)}`;
      console.error(msg);
    } finally {
      setLoading(false);
    }
  }, [
    instruction
  ]);

  const handleClear = useCallback(() => {
    setEditorContent('');
  }, []);


  // ---- render ----
  return (
    <Box className="flex flex-col gap-2 w-full relative">
      {editorContent && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Prompt Editor</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box className="rounded-5 h-full">
              {/* CodeMirror or similar editor can be placed here */}
              <TextField
                multiline
                fullWidth
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                variant="outlined"
                placeholder="Paste or type your generated prompt here..."
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      <Box
        position="relative"
        className="mt-2 px-2 pr-12 overflow-auto max-h-[100px] items-end h-full"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleGenerateCode();
          }
        }}
      >
        <Box className="mb-0">
          <TextField
            multiline
            fullWidth
            placeholder="Type your instruction..."
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            variant="standard"
            InputProps={{ disableUnderline: true }}
            className="mb-2 border-0"
            sx={{
              p: 0,
              '& .css-1asjr57-MuiFormControl-root-MuiTextField-root': {
                backgroundColor: `${theme.palette.background.default}  !important`,
              },
            }}
          />
        </Box>
      </Box>
      <Box
        className="absolute top-2 right-0 flex items-center"
        sx={{ paddingRight: theme.spacing(1) }}
      >
        <Tooltip title="Generate/Modify Code">
          <IconButton
            color="success"
            onClick={handleGenerateCode}
            disabled={!instruction}
          >
            {loading ? <CircularProgress size={16} /> : <SendIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      {loading && (
        <Box className="mt-2 flex items-center">
          <CircularProgress size={20} className="mr-1" />
          <Typography variant="body2">Generating...</Typography>
        </Box>
      )}
    </Box>
  );
};

export default AIPromptEditor;