import React from 'react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BuildIcon from '@mui/icons-material/Build';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TerminalIcon from '@mui/icons-material/Terminal';

type ScriptIconMap = { [key: string]: React.ElementType };

export const scriptIcons: ScriptIconMap = {
  dev: PlayArrowIcon,
  build: BuildIcon,
  lint: FormatListBulletedIcon,
  format: FormatAlignLeftIcon,
  preview: VisibilityIcon,
  // Add more mappings for other common scripts
  // e.g., test: BugReportIcon,
  // e.g., start: PlayCircleOutlineIcon,
};

export const defaultScriptIcon = TerminalIcon;
