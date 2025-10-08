import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { EditorView, Line } from '@codemirror/view'; // Import Line type
import { javascript } from '@codemirror/lang-javascript';
import CodeMirror from '@uiw/react-codemirror';
import { getCodeMirrorLanguage, createCodeMirrorTheme, getFileExtension } from '@/utils/index';
import { Box, useTheme } from '@mui/material';
import { themeStore } from '@/stores/themeStore';
import { LanguageSupport, syntaxTree } from '@codemirror/language';
import CodeMirrorStatus from './CodeMirrorStatus';
import { Extension, EditorState } from '@codemirror/state';
import { linter, lintGutter, Diagnostic } from '@codemirror/lint';
import { llmStore } from '@/stores/llmStore';
import { fileStore } from '@/stores/fileStore';

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

// Function to generate diagnostics, extracted from basicLinter
const generateBasicDiagnostics = (view: EditorView): Diagnostic[] => {
  const diagnostics: Diagnostic[] = [];
  try {
    // === ADDED DEFENSIVE CHECK ===
    // Ensure view.state.doc and its iterLines method are valid before attempting iteration.
    // The 'child is undefined' error can originate from CodeMirror's internal Text object
    // if it's in an inconsistent state, especially during rapid updates.
    if (!view.state || !view.state.doc || typeof view.state.doc.iterLines !== 'function') {
      console.warn("generateBasicDiagnostics: Invalid view.state.doc encountered, skipping linter pass.", view.state.doc);
      return [];
    }

    const tree = syntaxTree(view.state);

    view.state.doc.iterLines((lineObj: Line) => {
      // Defensive check for lineObj and its text property
      if (!lineObj || typeof lineObj.text !== 'string') {
        console.warn("generateBasicDiagnostics: Invalid line object encountered during iteration.", lineObj);
        return; // Skip this line if invalid
      }
      const lineText = lineObj.text;
      const lineNumber = lineObj.number; // Use lineObj.number directly for 1-based line number
      console.log(lineText);
      const todoMatch = lineText.match(/TODO/i);
      if (todoMatch) {
        
        diagnostics.push({
          from: lineObj.from + (todoMatch.index || 0),
          to: lineObj.from + (todoMatch.index || 0) + todoMatch[0].length,
          severity: 'warning',
          message: 'Todo item found',
          source: 'codejector-linter', // Changed source
        });
      }

      // NEW: Check for console statements
      const consoleLogMatch = lineText.match(/console\.(log|warn|error|info|debug)\s*\(/);
      console.log(consoleLogMatch);
      if (consoleLogMatch) {
        diagnostics.push({
          from: lineObj.from + (consoleLogMatch.index || 0),
          to: lineObj.from + (consoleLogMatch.index || 0) + consoleLogMatch[0].length,
          severity: 'warning',
          message: 'Avoid console statements in production code',
          source: 'codejector-linter',
        });
      }

      // NEW: Check for debugger statements
      const debuggerMatch = lineText.match(/\bdebugger\b/);
      if (debuggerMatch) {
        diagnostics.push({
          from: lineObj.from + (debuggerMatch.index || 0),
          to: lineObj.from + (debuggerMatch.index || 0) + debuggerMatch[0].length,
          severity: 'error', // Often treated as an error in production environments
          message: 'Debugger statement found',
          source: 'codejector-linter',
        });
      }

      // Example: Basic check for empty lines (can be expanded)
      // Avoid marking the very last empty line or first empty line unless specifically desired
      // doc.lines gives total number of lines (1-based count)
      if (
        lineText.trim() === '' &&
        lineNumber > 1 && // Not the first line if empty
        lineNumber < view.state.doc.lines // Not the very last line if empty
      ) {
        diagnostics.push({
          from: lineObj.from,
          to: lineObj.from + lineText.length,
          severity: 'info',
          message: 'Empty line',
          source: 'codejector-linter', // Changed source
        });
      }
    });

    tree.iterate({
      enter: (node) => {
        // Added defensive check for node validity
        if (!node || !node.type || !node.type.name) {
          console.warn("generateBasicDiagnostics: Invalid syntax tree node encountered.", node);
          return;
        }
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
    console.error("Error within generateBasicDiagnostics linter function:", e);
    diagnostics.push({
      from: 0,
      to: view.state.doc.length, // Report error over the entire document
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
  const { buildOutput } = useStore(llmStore); // Get buildOutput from llmStore
  const { saveFileContentError } = useStore(fileStore); // Get saveFileContentError from fileStore

  const [editorViewInstance, setEditorViewInstance] = useState<EditorView | null>(null);

  // State for CodeMirrorStatus
  const [currentLine, setCurrentLine] = useState(1);
  const [currentColumn, setCurrentColumn] = useState(1);
  const [currentLanguageName, setCurrentLanguageName] = useState('Plain Text');
  const [lintIssuesCount, setLintIssuesCount] = useState(0); // State for lint issues count

  const handleChange = React.useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange],
  );

  // Memoize the linter extension itself
  const basicLinterExtension = React.useMemo(() => {
    return linter(generateBasicDiagnostics);
  }, []); // Empty dependency array as generateBasicDiagnostics is a pure function


  const handleUpdate = React.useCallback(
    (viewUpdate: { view: EditorView; state: EditorState }) => {
      const { view, state } = viewUpdate;

      // Pass the EditorView to the parent component via callback on every update
      if (onEditorViewChange && view) {
        onEditorViewChange(view);
      }
      // Also store it locally for CodeMirrorStatus if it's a new view instance
      if (view && view !== editorViewInstance) {
        setEditorViewInstance(view);
      }

      // Update line and column for status bar
      if (view) {
        const selection = view.state.selection.main;
        const line = view.state.doc.lineAt(selection.head);
        setCurrentLine(line.number);
        setCurrentColumn(selection.head - line.from + 1);

        // Update language name for status bar
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

        // --- CORRECTED: Update lint issues count from the editor state's diagnostics --- 
        // Get all diagnostics currently in the editor state, managed by lint extensions.
        //const diagnostics = getDiagnostics(state);
        //setLintIssuesCount(diagnostics.length);
      }
    },
    [onEditorViewChange, editorViewInstance, language, filePath], // basicLinter is not a dependency now
  );

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
      createCodeMirrorTheme(muiTheme),
      EditorView.lineWrapping,
      //lintGutter(), // Add lint gutter
      //basicLinterExtension, // Add custom linter extension
      ...(additionalExtensions || []),
    ];
  }, [language, filePath, muiTheme, additionalExtensions, basicLinterExtension]); // basicLinterExtension is a dependency now

  // Determine the build error message to display
  const buildErrorMessage = buildOutput?.stderr || saveFileContentError || null;

  return (
    <Box
      className={`flex flex-col ${classNames || ''}`}
      sx={{
        height: height || '100%',
        width: width || '100%',
      }}
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
      />
    </Box>
  );
};

export default CodeMirrorEditor;
