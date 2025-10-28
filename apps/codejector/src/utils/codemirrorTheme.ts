import path from 'path-browserify';
import { EditorView } from '@codemirror/view';
import { type Theme } from '@mui/material';
import { LanguageSupport } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { diffLanguage } from './diffLanguage'; // New import for custom diff highlighting
/**
 * Creates a CodeMirror theme extension that applies Material UI theme colors
 * for the background, text, and other core editor elements.
 * This theme prioritizes matching the parent component's background.
 *
 * @param muiTheme The Material UI theme object.
 * @param isDiffView Optional. If true, applies specific styles for diff views.
 * @returns A CodeMirror `EditorView.theme` extension.
 */
export const createCodeMirrorTheme = (
  muiTheme: Theme,
  isDiffView: boolean = false,
) => {
  const backgroundColor = muiTheme.palette.background.default;
  const textColor = muiTheme.palette.text.primary;
  const gutterBackground = muiTheme.palette.background.paper;
  const gutterColor = muiTheme.palette.text.secondary;
  const lineNumberColor = muiTheme.palette.text.disabled;
  const cursorColor = muiTheme.palette.primary.main;
  const selectionBackground = muiTheme.palette.action.selected;
  const activeLineBackground = muiTheme.palette.action.hover;

  const diffInserted = muiTheme.palette.success.light;
  const diffDeleted = muiTheme.palette.error.light;

  return EditorView.theme(
    {
      // Core editor styles
      '&': {
        backgroundColor: backgroundColor,
        color: textColor,
        // Ensure font family is consistent
        fontFamily:
          (muiTheme.typography.fontFamily as string | undefined) || 'monospace',
      },
      '.cm-scroller': {
        backgroundColor: backgroundColor,
      },

      '.cm-editor': {
        border: 'none',
        outline: 'none',
      },
      // Selection
      '.cm-selectionBackground, .cm-selectionBackground::selection': {
        backgroundColor: selectionBackground + ' !important',
      },
      '.cm-focused .cm-selectionBackground, .cm-focused .cm-selectionBackground::selection':
        {
          backgroundColor: selectionBackground + ' !important',
        },

      // Active Line
      '.cm-activeLine': {
        backgroundColor: activeLineBackground,
      },

      // Gutters
      '.cm-gutters': {
        backgroundColor: gutterBackground,
        color: gutterColor,
        borderRight: `1px solid ${muiTheme.palette.divider}`,
      },
      '.cm-lineNumbers .cm-gutterElement': {
        color: lineNumberColor,
        padding: '0 8px',
      },
      '.cm-activeLineGutter': {
        backgroundColor: activeLineBackground,
        color: muiTheme.palette.text.primary,
      },

      // Cursor
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: cursorColor,
      },

      // Diff-specific styles if enabled
      ...(isDiffView && {
        '.cm-inserted': {
          backgroundColor: diffInserted + '40',
          color: textColor,
        },
        '.cm-deleted': {
          backgroundColor: diffDeleted + '40',
          color: textColor,
        },
        '.cm-inserted.cm-activeLine': {
          backgroundColor: diffInserted + '60',
        },
        '.cm-deleted.cm-activeLine': {
          backgroundColor: diffDeleted + '60',
        },
        '.cm-meta': { color: muiTheme.palette.info.main }, // Hunk headers
        '.cm-keyword': { color: muiTheme.palette.warning.main }, // Git diff headers like `diff --git`
      }),
    },
    { dark: muiTheme.palette.mode === 'dark' }, // Essential for CodeMirror's dark mode internal state
  );
};

export function getCodeMirrorLanguage(
  filePath: string,
  isDiff: boolean = false,
): LanguageSupport[] {
  if (isDiff) {
    return [diffLanguage()]; // Return custom diff language extension if explicitly marked as diff
  }

  const ext = path.extname(filePath).toLowerCase();
  // Handle files without extensions but with known names (e.g., Dockerfile)
  const fileName = path.basename(filePath).toLowerCase();

  switch (ext) {
    case '.js':
    case '.jsx':
      return [javascript({ jsx: true })];
    case '.ts':
    case '.tsx':
      return [javascript({ typescript: true, jsx: true })]; // Use javascript with typescript option
    case '.json':
      return [json()];
    case '.md':
    case '.markdown':
      return [markdown()];
    case '.html':
    case '.htm':
      return [html()];
    case '.css':
    case '.scss':
    case '.less':
      return [css()];
    // Add more extensions as needed for CodeMirror language support
    default:
      // Handle specific filenames that might not have an extension but need language support
      if (fileName === 'dockerfile') {
        // return [dockerfileLanguage()]; // If you have a dockerfile language extension
        return [];
      } else if (fileName === 'makefile') {
        // return [makeLanguage()]; // If you have a makefile language extension
        return [];
      }
      return []; // No specific language support, defaults to plain text
  }
}

/**
 * Returns a human-readable language name based on the file path's extension.
 * @param filePath The path of the file.
 * @returns A string representing the language name (e.g., "TypeScript", "JavaScript", "JSON", "Markdown", "HTML", "CSS", "Plain Text").
 */
export function getLanguageNameFromPath(filePath: string): string {
  if (!filePath) {
    return 'Plain Text';
  }

  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath).toLowerCase();

  switch (ext) {
    case '.js':
    case '.jsx':
      return 'JavaScript';
    case '.ts':
    case '.tsx':
      return 'TypeScript';
    case '.json':
      return 'JSON';
    case '.md':
    case '.markdown':
      return 'Markdown';
    case '.html':
    case '.htm':
      return 'HTML';
    case '.css':
    case '.scss':
    case '.less':
      return 'CSS';
    case '.yml':
    case '.yaml':
      return 'YAML';
    case '.xml':
      return 'XML';
    case '.py':
      return 'Python';
    case '.java':
      return 'Java';
    case '.c':
    case '.cpp':
    case '.h':
      return 'C/C++';
    case '.go':
      return 'Go';
    case '.rs':
      return 'Rust';
    case '.php':
      return 'PHP';
    case '.rb':
      return 'Ruby';
    case '.sh':
    case '.bash':
      return 'Shell Script';
    case '.sql':
      return 'SQL';
    case '.vue':
      return 'Vue';
    case '.svelte':
      return 'Svelte';
    case '.toml':
      return 'TOML';
    case '.ini':
      return 'INI';
    case '.log':
      return 'Log';
    // Add more common extensions here

    default:
      // Handle specific filenames without extensions
      if (fileName === 'dockerfile') return 'Dockerfile';
      if (fileName === 'makefile') return 'Makefile';
      if (fileName === 'licence' || fileName === 'license') return 'License';
      if (fileName === 'readme' || fileName.startsWith('readme.'))
        return 'Markdown';
      if (fileName === '.env' || fileName.startsWith('.env.'))
        return 'Environment Variables';
      if (fileName === 'package.json') return 'JSON (Package)';
      if (fileName === 'tsconfig.json') return 'JSON (TS Config)';
      if (fileName === 'vite.config.ts') return 'TypeScript (Vite Config)';
      if (fileName === 'eslint.config.ts') return 'TypeScript (ESLint Config)';
      if (
        fileName === 'yarn.lock' ||
        fileName === 'pnpm-lock.yaml' ||
        fileName === 'package-lock.json'
      )
        return 'Lockfile';

      return 'Plain Text'; // Default for unknown extensions
  }
}
