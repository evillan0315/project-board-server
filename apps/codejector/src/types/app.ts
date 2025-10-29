import React from 'react';
import { SvgIconComponent } from '@mui/icons-material';
import { RequestType, LlmOutputFormat } from './llm';
import { FileEntry } from './refactored/fileTree';
import { ButtonColor, ButtonVariant } from '@mui/material/Button';
import { SvgIconTypeMap } from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';

export type MuiIconComponent = OverridableComponent<
  SvgIconTypeMap<{}, 'svg'>
> & {
  muiName: string;
};

// =========================================================================
// App & UI Component Types
// =========================================================================

export interface AppDefinition {
  id: string;
  title: string;
  description: string;
  link: string;
  linkText: string;
  icon: MuiIconComponent;
  category: string;
  tags?: string[];
  requestType?: RequestType; // Optional, for apps that pre-configure AI editor
  llmOutputFormat?: LlmOutputFormat;
}

// Profile Menu Item Definition (for ProfileMenuContent)
export interface ProfileMenuItem {
  id: string;
  title: string;
  description?: string;
  link?: string;
  action?: 'logout'; // Specific action for logout
  icon: React.ElementType; // For Material UI Icons
}

export interface ContextMenuItem {
  type?: 'item' | 'divider' | 'header';
  label?: string;
  icon?: React.ReactNode; // Can be a Material Icon component or other ReactNode
  action?: (file: FileEntry) => void;
  className?: string;
  disabled?: boolean;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  targetFile: FileEntry | null; // The FileEntry that the context menu was opened for
}

export interface GlobalAction {
  label?: string; // Made optional as component might not need a label for GlobalActionButton
  action?: () => void; // Made optional as component might not need an action for GlobalActionButton
  icon?: React.ReactNode;
  color?: ButtonColor;
  variant?: ButtonVariant;
  disabled?: boolean;
  component?: React.ReactNode; // NEW: Allow rendering a custom React component directly
}
