import { map } from 'nanostores';
import { ContextMenuState, ContextMenuItem } from '@/types';
import type { FileEntry } from '@/types/refactored/fileTree'; // Updated import

export const fileTreeContextMenu = map<ContextMenuState>({
  visible: false,
  x: 0,
  y: 0,
  items: [],
  targetFile: null,
});

export const showFileTreeContextMenu = (
  visible: boolean,
  x: number,
  y: number,
  items: ContextMenuItem[],
  targetFile: FileEntry | null,
) => {
  fileTreeContextMenu.set({
    visible,
    x,
    y,
    items,
    targetFile,
  });
};

export const hideFileTreeContextMenu = () => {
  fileTreeContextMenu.set({
    visible: false,
    x: 0,
    y: 0,
    items: [],
    targetFile: null,
  });
};
