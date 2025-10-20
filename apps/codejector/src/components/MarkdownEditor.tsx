import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  Tabs,
  Tab,
  IconButton,
  AppBar,
  Toolbar,
  Tooltip,
  useTheme,
  Paper,
  Divider,
  Typography,
} from '@mui/material';
import BoldIcon from '@mui/icons-material/FormatBold';
import ItalicIcon from '@mui/icons-material/FormatItalic';
import CodeIcon from '@mui/icons-material/Code';
import ListIcon from '@mui/icons-material/FormatListBulleted';
import QuoteIcon from '@mui/icons-material/FormatQuote';
import LinkIcon from '@mui/icons-material/InsertLink';
import ImageIcon from '@mui/icons-material/Image';
import TitleIcon from '@mui/icons-material/Title';
import TaskIcon from '@mui/icons-material/CheckBox';
import { keymap } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { themeStore } from '@/stores/themeStore';
import { getCodeMirrorLanguage, createCodeMirrorTheme } from '@/utils/index';
// ✅ GitHub markdown light & dark styles
//import 'github-markdown-css/github-markdown.css';
//import 'github-markdown-css/github-markdown-dark.css';
//import '@/styles/markdown.css';
import ReactMarkdownWithCodeCopy from '@/components/markdown/ReactMarkdownWithCodeCopy';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SchemaIcon from '@mui/icons-material/Schema';

interface MarkdownEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  initialValue?: string;
  onImageUpload?: (file: File) => Promise<string>;
  onSave?: () => void;
  disabled?: boolean;
  expectedSchema?: string;
  exampleOutput?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  initialValue = '',
  onImageUpload,
  onSave,
  disabled = false,
  expectedSchema,
  exampleOutput,
}) => {
  const { mode } = useStore(themeStore); // 'light' | 'dark'
  const theme = useTheme();
  const [internalValue, setInternalValue] = useState(
    value ?? localStorage.getItem('markdown-editor-content') ?? initialValue,
  );
  const [tab, setTab] = useState(0); // 0 = Write, 1 = Preview, 2 = Schema

  /** ---------- Sync with localStorage / controlled props ---------- */
  useEffect(() => {
    if (value === undefined) {
      localStorage.setItem('markdown-editor-content', internalValue);
    }
  }, [internalValue, value]);

  useEffect(() => {
    if (value !== undefined) setInternalValue(value);
  }, [value]);

  const setValue = (v: string) => {
    if (value === undefined) setInternalValue(v);
    onChange?.(v);
  };

  /** ---------- Toolbar Helpers ---------- */
  const insertText = (before: string, after = '') => {
    setValue(internalValue + before + after);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0] && onImageUpload) {
      const url = await onImageUpload(e.target.files[0]);
      setValue(internalValue + `\n![alt text](${url})`);
    }
  };

  /** ---------- Dynamic GitHub Markdown class ---------- */
  const markdownClass = mode === 'dark' ? 'markdown-body' : 'markdown-body';

  return (
    <Paper
      variant="outlined"
      sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar
          variant="dense"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {/* ---------- Left: Editor tool icons ---------- */}
          <Box>
            <Tooltip title="Bold">
              <IconButton onClick={() => insertText('**bold**')}>
                <BoldIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Italic">
              <IconButton onClick={() => insertText('*italic*')}>
                <ItalicIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Heading">
              <IconButton onClick={() => insertText('# Heading\n')}>
                <TitleIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Code">
              <IconButton onClick={() => insertText('```\ncode\n```')}>
                <CodeIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="List">
              <IconButton onClick={() => insertText('- item\n')}>
                <ListIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Blockquote">
              <IconButton onClick={() => insertText('> quote\n')}>
                <QuoteIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Task list">
              <IconButton onClick={() => insertText('- [ ] task\n')}>
                <TaskIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Link">
              <IconButton onClick={() => insertText('[text](url)')}>
                <LinkIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Image">
              <IconButton component="label">
                <ImageIcon />
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </IconButton>
            </Tooltip>
          </Box>

          {/* ---------- Right: Write / Preview toggle ---------- */}
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab icon={<EditIcon />} aria-label="write" />
            <Tab icon={<VisibilityIcon />} aria-label="preview" />
            {expectedSchema && exampleOutput && (
              <Tab icon={<SchemaIcon />} aria-label="schema" />
            )}
          </Tabs>
        </Toolbar>
        <Divider />
      </AppBar>

      {/* ---------- Editor / Preview Area ---------- */}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        {tab === 0 && (
          <CodeMirror
            value={internalValue}
            height="100%"
            extensions={[
              getCodeMirrorLanguage(`editor.md`),
              createCodeMirrorTheme(theme),
              markdown(),
              keymap.of([
                {
                  key: 'Mod-s',
                  run: () => {
                    onSave?.();
                    return true;
                  },
                },
              ]),
            ]}
            theme={mode}
            editable={!disabled}
            onChange={(val) => setValue(val)}
            style={{ flex: 1 }}
          />
        )}
        {tab === 1 && (
          <Box
            sx={{ p: 2, overflowY: 'auto', flex: 1 }}
            className={markdownClass}
          >
            <ReactMarkdownWithCodeCopy>
              {internalValue}
            </ReactMarkdownWithCodeCopy>
          </Box>
        )}
        {tab === 2 && (
          <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
            {expectedSchema && (
              <>
                <Typography variant="h6">Expected Schema:</Typography>
                <CodeMirror
                  value={expectedSchema}
                  height="200px"
                  extensions={[
                    getCodeMirrorLanguage(`json`),
                    createCodeMirrorTheme(theme),
                  ]}
                  theme={mode}
                  editable={false}
                />
              </>
            )}
            {exampleOutput && (
              <>
                <Typography variant="h6">Example Output:</Typography>
                <CodeMirror
                  value={exampleOutput}
                  height="200px"
                  extensions={[
                    getCodeMirrorLanguage(`json`),
                    createCodeMirrorTheme(theme),
                  ]}
                  theme={mode}
                  editable={false}
                />
              </>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default MarkdownEditor;
