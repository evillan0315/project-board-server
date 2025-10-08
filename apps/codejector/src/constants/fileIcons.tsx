import React from 'react';
import JavascriptIcon from '@mui/icons-material/Javascript';
import CssIcon from '@mui/icons-material/Css';
import HtmlIcon from '@mui/icons-material/Html';
import JsonIcon from '@mui/icons-material/DataObject'; // DataObject is a good fit for JSON
import MarkdownIcon from '@mui/icons-material/Article'; // Article for documents
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description'; // Generic text file
import CodeIcon from '@mui/icons-material/Code'; // Generic code file
import TerminalIcon from '@mui/icons-material/Terminal'; // For shell scripts, .env, .gitignore
// For web-related files
import FolderOpenIcon from '@mui/icons-material/FolderOpenOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import { MaterialIconThemeTypescriptDef } from '@/components/icons/MaterialIconThemeTypescriptDef';
import { FileIconsTsx } from '@/components/icons/FileIconsTsx';
import { TeenyiconsJavascriptOutline } from '@/components/icons/TeenyiconsJavascriptOutline';
import { MaterialIconThemeTsconfig } from '@/components/icons/MaterialIconThemeTsconfig';
import { MaterialIconThemeJsconfig } from '@/components/icons/MaterialIconThemeJsconfig';
import { MaterialIconThemeHtml } from '@/components/icons/MaterialIconThemeHtml';
import { MaterialSymbolsMarkdownRounded } from '@/components/icons/MaterialSymbolsMarkdownRounded';
import { MaterialIconThemeJson } from '@/components/icons/MaterialIconThemeJson';
import { MdiCodeJson } from '@/components/icons/MdiCodeJson';
import { MaterialIconThemeCss } from '@/components/icons/MaterialIconThemeCss';
import { MaterialIconThemeSvg } from '@/components/icons/MaterialIconThemeSvg';
import { MaterialSymbolsLightFilePng } from '@/components/icons/MaterialSymbolsLightFilePng';
import { MaterialSymbolsGifBox } from '@/components/icons/MaterialSymbolsGifBox';
import { MaterialIconThemeTypescript } from '@/components/icons/MaterialIconThemeTypescript';
import { VscodeIconsFileTypeTsconfig } from '@/components/icons/VscodeIconsFileTypeTsconfig';
import { CatppuccinYarnLock } from '@/components/icons/CatppuccinYarnLock';
import { GgReadme } from '@/components/icons/GgReadme';
import { ClarityLicenseSolid } from '@/components/icons/ClarityLicenseSolid';
import { EosIconsEnv } from '@/components/icons/EosIconsEnv';
import { SimpleIconsGitignoredotio } from '@/components/icons/SimpleIconsGitignoredotio';
import { FxemojiFolder } from '@/components/icons/FxemojiFolder';
import { FxemojiOpenfolder } from '@/components/icons/FxemojiOpenfolder';

type IconComponent =
  | React.ElementType
  | React.FC<{
      fontSize: 'small' | 'medium' | 'large' | 'inherit';
      sx?: object;
    }>;

// Map of file extensions (or full filenames for dotfiles) to Material UI Icons or custom JSX.
// Keys should be lowercase.
const fileExtensionIcons: { [key: string]: IconComponent } = {
  // Code / Programming Languages
  '.js': TeenyiconsJavascriptOutline,
  '.jsx': JavascriptIcon,
  '.ts': MaterialIconThemeTypescript,
  '.tsx': MaterialIconThemeTypescriptDef,
  '.mjs': JavascriptIcon,
  '.cjs': JavascriptIcon,
  '.json': MdiCodeJson,
  '.css': MaterialIconThemeCss,
  '.scss': MaterialIconThemeCss,
  '.less': CssIcon,
  '.html': MaterialIconThemeHtml,
  '.htm': HtmlIcon,
  '.xml': CodeIcon,
  '.py': CodeIcon, // No specific Python icon in MUI by default, use generic code
  '.java': CodeIcon, // Generic code
  '.go': CodeIcon, // Generic code
  '.rb': CodeIcon, // Generic code
  '.php': CodeIcon, // Generic code
  '.c': CodeIcon,
  '.cpp': CodeIcon,
  '.h': CodeIcon,
  '.sh': TerminalIcon,
  '.bash': TerminalIcon,
  '.zsh': TerminalIcon,
  '.ps1': TerminalIcon,
  '.md': MaterialSymbolsMarkdownRounded,
  '.markdown': MaterialSymbolsMarkdownRounded,
  '.yml': DescriptionIcon, // YAML
  '.yaml': DescriptionIcon, // YAML
  '.toml': DescriptionIcon,
  '.env': EosIconsEnv,

  // Web / Config / Build
  '.lock': CatppuccinYarnLock, // package-lock.json, yarn.lock, pnpm-lock.yaml
  'package.json': MaterialIconThemeJson, // Specific file name
  'tsconfig.json': MaterialIconThemeTsconfig,
  'vite.config.ts': VscodeIconsFileTypeTsconfig,
  'eslint.config.ts': MaterialIconThemeJsconfig,
  'tailwind.config.ts': JavascriptIcon,
  'next.config.js': JavascriptIcon,
  'ecosystem.config.cjs': MaterialIconThemeJsconfig,
  '.gitignore': SimpleIconsGitignoredotio,
  'readme.md': GgReadme,
  license: ClarityLicenseSolid,

  // Media
  '.png': MaterialSymbolsLightFilePng,
  '.jpg': ImageIcon,
  '.jpeg': ImageIcon,
  '.gif': MaterialSymbolsGifBox,
  '.svg': MaterialIconThemeSvg,
  '.webp': ImageIcon,
  '.ico': ImageIcon,
  '.pdf': PictureAsPdfIcon,
  '.txt': DescriptionIcon,
};

/**
 * Returns a Material UI icon component or a custom JSX element based on file type and extension.
 * @param fileName The full name of the file (e.g., 'index.ts', 'package.json').
 * @param fileType 'file' or 'folder'.
 * @param isExpanded For folders, indicates if it's currently expanded.
 * @returns A React component for the icon.
 */
export const getFileTypeIcon = (
  fileName: string,
  fileType: 'file' | 'folder',
  isExpanded: boolean = false,
  size?: 'small' | 'medium' | 'large' | 'inherit' = 'inherit',
): React.ReactElement => {
  if (fileType === 'folder') {
    return isExpanded ? (
      <FxemojiOpenfolder fontSize={size} />
    ) : (
      <FxemojiFolder fontSize={size} />
    );
  }

  // Check for specific full filenames first (e.g., 'package.json')
  const exactMatchIcon = fileExtensionIcons[fileName.toLowerCase()];
  if (exactMatchIcon) {
    const Icon = exactMatchIcon as React.ElementType;
    return <Icon fontSize={size} />;
  }

  // Check for file extensions
  const ext = fileName.toLowerCase().includes('.')
    ? `.${fileName.toLowerCase().split('.').pop()}`
    : '';
  const extMatchIcon = fileExtensionIcons[ext];
  if (extMatchIcon) {
    const Icon = extMatchIcon as React.ElementType;
    return <Icon fontSize={size} />;
  }

  // Default to a generic file icon if no specific match
  return <DescriptionIcon fontSize={size} />;
};
