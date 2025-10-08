import { persistentAtom } from '@/utils/persistentAtom';
import type { ReactNode } from 'react';

// --- Right Sidebar ---

// Whether the right sidebar is visible
export const isRightSidebarVisible = persistentAtom<boolean>(
  'isRightSidebarVisible',
  false,
);

// What content should be rendered inside the right sidebar
export const rightSidebarContent = atom<ReactNode | null>(null);

// Right sidebar width
export const rightSidebarWidth = persistentAtom<number>(
  'rightSidebarWidth',
  300,
);

// --- Left Sidebar ---

// Whether the left sidebar is visible
export const isLeftSidebarVisible = persistentAtom<boolean>(
  'isLeftSidebarVisible',
  false,
);

// What content should be rendered inside the left sidebar
export const leftSidebarContent = atom<ReactNode | null>(null);

// Left sidebar width
export const leftSidebarWidth = persistentAtom<number>('leftSidebarWidth', 300);

import { atom } from 'nanostores';
