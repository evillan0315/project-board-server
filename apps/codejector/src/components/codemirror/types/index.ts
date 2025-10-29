import { ReactNode } from 'react';

/**
 * @interface ICodeMirrorContextMenuItem
 * @description Represents a single item in the CodeMirror editor's context menu.
 */
export interface ICodeMirrorContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: (editorView: any) => void;
  isDivider?: boolean;
  isHeader?: boolean;
  headerLabel?: string;
  disabled?: boolean;
}

/**
 * @interface ICodeMirrorContextMenuState
 * @description Manages the state for the CodeMirror editor's custom context menu.
 */
export interface ICodeMirrorContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  items: ICodeMirrorContextMenuItem[];
}
