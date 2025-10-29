import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { EditorView, Line } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import CodeMirror from '@uiw/react-codemirror';
import { getCodeMirrorLanguage, createCodeMirrorTheme, getFileExtension } from '@/utils/index';
import { Box, useTheme } from '@mui/material';
import { themeStore } from '@/stores/themeStore';
import { LanguageSupport, syntaxTree } from '@codemirror/language';
import { Extension, EditorState, ChangeSpec } from '@codemirror/state';
import { linter, lintGutter, Diagnostic } from '@codemirror/lint';
import {
  undo,
  redo,
  selectAll,
  indentSelection,
  historyField,
  history,
} from '@codemirror/commands';
import { llmStore } from '@/stores/llmStore';
import { fileStore } from '@/stores/fileStore';
import CodeMirrorStatus from './CodeMirrorStatus';
import CodeMirrorContextMenu from './CodeMirrorContextMenu';
import { codeMirrorContextMenuStore, showCodeMirrorContextMenu, hideCodeMirrorContextMenu } from './stores/codeMirrorContextMenuStore';
import { ICodeMirrorContextMenuItem } from './types';
// CodeMirror commands for the context menu

// Material Icons for context menu
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  filePath?: string;
  isDisabled?: boolean;
  classNames?: string;
  height?: string;
  width?: string;
  onEditorViewChange?: (view: EditorView) => void;
  additionalExtensions?: Extension[];
}
// Function to generate basic diagnostics for production-level checks
const generateBasicDiagnostics = (view: EditorView): Diagnostic[] => {
  const diagnostics: Diagnostic[] = [];
  const doc = view.state.doc;
  try {
    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      const lineText = line.text;
      // 1. Detect empty lines
      if (lineText.trim().length === 0) {
        diagnostics.push({
          from: line.from,
          to: line.to,
          severity: 'info',
          message: 'Empty line',
          source: 'editor-linter',
        });
      }
      // 2. Detect console statements
      const consoleRegex = /console\.(log|warn|error|info|debug)\(.+\);?/g;
      let match;
      while ((match = consoleRegex.exec(lineText)) !== null) {
        diagnostics.push({
          from: line.from + match.index,
          to: line.from + match.index + match[0].length,
          severity: 'warning',
          message: 'Avoid console statements in production code',
          source: 'editor-linter',
        });
      }
     // Detect  statements
const debuggerRegex = /\bdebugger\b/g;
while ((match = debuggerRegex.exec(lineText)) !== null) {
  diagnostics.push({
    from: line.from + match.index,
    to: line.from + match.index + match[0].length,
    severity: 'warning',
    message: 'Debugger statement found',
    source: 'editor-linter',
  });
}
    }
    // 4. Detect generic syntax errors from CodeMirror's language parser
    syntaxTree(view.state).iterate({
      enter: (node) => {
        if (!node?.type?.name) return;
        if (node.type.name === '⚠') {
          diagnostics.push({
            from: node.from,
            to: node.to,
            severity: 'error',
            message: `Syntax Error: ${view.state.doc.sliceString(node.from, node.to)}`,
            source: 'codemirror-syntax',
          });
        }
      },
    });
  } catch (e) {
    diagnostics.push({
      from: 0,
      to: doc.length,
      severity: 'error',
      message: `Linter internal error: ${e instanceof Error ? e.message : String(e)}`,
      source: 'custom-linter-error',
    });
  }
  return diagnostics;
};
const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({
  value,
  onChange,
  language,
  filePath,
  isDisabled,
  classNames,
  height,
  width,
  onEditorViewChange,
  additionalExtensions,
}) => {
  const muiTheme = useTheme();
  const { mode } = useStore(themeStore);
  const { buildOutput } = useStore(llmStore);
  const { saveFileContentError } = useStore(fileStore);
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorViewInstance, setEditorViewInstance] = useState<EditorView | null>(null);
  const [currentLine, setCurrentLine] = useState(1);
  const [currentColumn, setCurrentColumn] = useState(1);
  const [currentLanguageName, setCurrentLanguageName] = useState('Plain Text');
  const [lintIssuesCount, setLintIssuesCount] = useState(0);
  const [allDiagnostics, setAllDiagnostics] = useState<Diagnostic[]>([]);
  const { visible: contextMenuVisible } = useStore(codeMirrorContextMenuStore);
  const handleChange = useCallback(
    (val: string) => onChange(val),
    [onChange],
  );
  // Custom linter with direct count tracking
  const basicLinterExtension = React.useMemo(() => {
    return linter((view) => {
      const diagnostics = generateBasicDiagnostics(view);
      setLintIssuesCount(diagnostics.length);
      setAllDiagnostics(diagnostics);
      return diagnostics;
    });
  }, []);
  const handleUpdate = useCallback(
    (viewUpdate: { view: EditorView; state: EditorState }) => {
      const { view } = viewUpdate;
      if (!view) return;
      if (onEditorViewChange) onEditorViewChange(view);
      if (view !== editorViewInstance) setEditorViewInstance(view);
      const selection = view.state.selection.main;
      const line = view.state.doc.lineAt(selection.head);
      setCurrentLine(line.number);
      setCurrentColumn(selection.head - line.from + 1);
      const languageData = view.state.languageDataAt(selection.head);
      const detectedLangName = languageData.find((data: any) => data.name)?.name;
      if (detectedLangName) {
        setCurrentLanguageName(
          detectedLangName.charAt(0).toUpperCase() + detectedLangName.slice(1),
        );
      } else if (language) {
        setCurrentLanguageName(language.charAt(0).toUpperCase() + language.slice(1));
      } else if (filePath) {
        const ext = getFileExtension(filePath);
        setCurrentLanguageName(ext ? ext.toUpperCase() : 'Plain Text');
      } else {
        setCurrentLanguageName('Plain Text');
      }
    },
    [onEditorViewChange, editorViewInstance, language, filePath],
  );
  // Function to scroll to a specific line in the editor
  const handleGoToLine = useCallback(
    (lineNumber: number) => {
      if (!editorViewInstance) return;
      const line = editorViewInstance.state.doc.line(lineNumber);
      editorViewInstance.dispatch({
        selection: { anchor: line.from },
        effects: EditorView.scrollIntoView(line.from, {
          y: 'center',
        }),
      });
    },
    [editorViewInstance],
  );
  // Function to automatically fix issues
  const handleAutoFix = useCallback(
    (fixableDiagnostics: Diagnostic[]) => {
      if (!editorViewInstance) return;
      const changes: ChangeSpec[] = [];
      // Sort diagnostics in reverse order of their 'from' position to apply changes safely
      const sortedDiagnostics = [...fixableDiagnostics].sort((a, b) => b.from - a.from);
      for (const diag of sortedDiagnostics) {
        const line = editorViewInstance.state.doc.lineAt(diag.from);
        let change: ChangeSpec | null = null;
        if (diag.message.includes('Avoid console statements')) {
          // Comment out the entire line containing the console statement
          const lineContent = editorViewInstance.state.doc.sliceString(line.from, line.to);
          change = { from: line.from, to: line.to, insert: `// ${lineContent}` };
        } else if (diag.message.includes('Debugger statement found')) {
          // Remove the statement
          change = { from: diag.from, to: diag.to, insert: '' };
        } else if (diag.message.includes('Empty line')) {
          // Remove the entire empty line, including the newline character if not the last line
          const isLastLine = line.number === editorViewInstance.state.doc.lines;
          change = { from: line.from, to: isLastLine ? line.to : line.to + 1, insert: '' };
        }
        if (change) {
          changes.push(change);
        }
      }
      if (changes.length > 0) {
        editorViewInstance.dispatch({ changes });
        // The editor's onUpdate and onChange handlers will be triggered automatically.
      }
    },
    [editorViewInstance],
  );
  // Helper functions for clipboard operations using document.execCommand
  const handleCopy = useCallback(() => {
    if (editorViewInstance) {
      
      editorViewInstance.focus(); // Ensure the editor has focus
      console.log(editorViewInstance, 'editorViewInstance');
      document.execCommand('copy');
    }
  }, [editorViewInstance]);
  const handleCut = useCallback(() => {
    if (editorViewInstance) {
      editorViewInstance.focus(); // Ensure the editor has focus
      document.execCommand('cut');
    }
  }, [editorViewInstance]);
  const handlePaste = useCallback(() => {
    if (editorViewInstance) {
      editorViewInstance.focus(); // Ensure the editor has focus
      // Note: document.execCommand('paste') is often blocked by browsers
      // for security reasons when not directly triggered by a user's
      // keyboard shortcut (Ctrl+V/Cmd+V) or native context menu.
      // It might not work reliably in all environments.
      document.execCommand('paste');
    }
  }, [editorViewInstance]);
  // NEW: Context menu handler
  const handleContextMenu = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!editorViewInstance || isDisabled) return;
      event.preventDefault(); // Prevent default browser context menu
      const { clientX, clientY } = event;
      // Check history state for undo/redo
      const historyState = editorViewInstance.state.field(historyField, false);
      const canUndo = historyState ? historyState.done.length > 0 : false;
      const canRedo = historyState ? historyState.undone.length > 0 : false;
      const isSelectionEmpty = editorViewInstance.state.selection.main.empty;
      const items: ICodeMirrorContextMenuItem[] = [
        {
          id: 'undo',
          label: 'Undo',
          icon: <UndoIcon fontSize="small" />,
          onClick: (view: EditorView) => undo(view),
          disabled: !canUndo,
        },
        {
          id: 'redo',
          label: 'Redo',
          icon: <RedoIcon fontSize="small" />,
          onClick: (view) => redo(view),
          disabled: !canRedo,
        },
        { id: 'divider-1', isDivider: true },
        {
          id: 'cut',
          label: 'Cut',
          icon: <ContentCutIcon fontSize="small" />,
          onClick: handleCut, // Use the new helper
          disabled: isSelectionEmpty,
        },
        {
          id: 'copy',
          label: 'Copy',
          icon: <ContentCopyIcon fontSize="small" />,
          onClick: handleCopy, // Use the new helper
          disabled: isSelectionEmpty,
        },
        {
          id: 'paste',
          label: 'Paste',
          icon: <ContentPasteIcon fontSize="small" />,
          onClick: handlePaste, // Use the new helper
          // It's hard to reliably check if paste is possible or if clipboard has text
          // via CodeMirror API directly due to browser security. We rely on editor focus.
          disabled: isDisabled,
        },
        { id: 'divider-2', isDivider: true },
        {
          id: 'selectAll',
          label: 'Select All',
          icon: <SelectAllIcon fontSize="small" />,
          onClick: (view) => selectAll(view),
        },
        {
          id: 'formatSelection',
          label: 'Format Selection',
          icon: <FormatAlignLeftIcon fontSize="small" />,
          onClick: (view:  EditorView) => {
            alert(view);
            // This is a basic indent. For full "format document"
            // a language-specific formatter extension would be needed.
            indentSelection(view);
          },
          disabled: isSelectionEmpty,
        },
      ];
      showCodeMirrorContextMenu(clientX, clientY, items);
    },
    [editorViewInstance, isDisabled, handleCopy, handleCut, handlePaste],
  ); // Add handleCopy, handleCut, handlePaste to dependencies
  // NEW: Global click listener to hide context menu
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenuVisible) {
        hideCodeMirrorContextMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenuVisible]);
  const extensions = React.useMemo(() => {
    const langExtensions: LanguageSupport[] = [];
    if (language) {
      if (language === 'typescript') {
        langExtensions.push(javascript({ jsx: true, typescript: true }));
      } else if (language === 'javascript') {
        langExtensions.push(javascript({ jsx: true }));
      }
    } else if (filePath) {
      langExtensions.push(...getCodeMirrorLanguage(filePath, false));
    }
    return [
      ...langExtensions,
      history(),
      createCodeMirrorTheme(muiTheme),
      EditorView.lineWrapping,
      lintGutter(),
      basicLinterExtension,
      ...(additionalExtensions || []),
    ];
  }, [language, filePath, muiTheme, additionalExtensions, basicLinterExtension]);
  const buildErrorMessage = buildOutput?.stderr || saveFileContentError || null;
  return (
    <Box
      ref={editorRef}
      className={`flex flex-col ${classNames || ''}`}
      sx={{ height: height || '100%', width: width || '100%' }}
      onContextMenu={handleContextMenu}
    >
      <Box className="flex-grow overflow-auto">
        <CodeMirror
          value={value}
          height="100%"
          width="100%"
          theme={mode}
          extensions={extensions}
          onChange={handleChange}
          onUpdate={handleUpdate}
          editable={!isDisabled}
        />
      </Box>
      <CodeMirrorStatus
        languageName={currentLanguageName}
        line={currentLine}
        column={currentColumn}
        lintIssuesCount={lintIssuesCount}
        buildErrorMessage={buildErrorMessage}
        filePath={filePath}
        diagnostics={allDiagnostics}
        editorViewInstance={editorViewInstance}
        onGoToLine={handleGoToLine}
        onAutoFix={handleAutoFix}
      />
      <CodeMirrorContextMenu editorView={editorViewInstance} />
    </Box>
  );
};
export default CodeMirrorEditor;
