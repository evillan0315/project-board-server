import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@nanostores/react';
import {
  fileTreeContextMenu,
  hideFileTreeContextMenu,
} from '@/stores/contextMenuStore';
import {
  Box,
  Typography,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  List,
} from '@mui/material';
// Generic file icon
// Generic folder icon
import { truncateFilePath } from '@/utils/fileUtils';
import { getFileTypeIcon } from '@/constants/fileIcons'; // For specific file icons
import { FileEntry } from '@/types/refactored/fileTree'; // Updated import path

export interface FileTreeContextMenuRendererProps {
  // Removed snackbar props, now handled globally via aiEditorStore
}

export const FileTreeContextMenuRenderer: React.FC<
  FileTreeContextMenuRendererProps
> = () => {
  const state = useStore(fileTreeContextMenu);
  const menuRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  const [adjustedTop, setAdjustedTop] = useState(state.y);
  const [adjustedLeft, setAdjustedLeft] = useState(state.x);

  useLayoutEffect(() => {
    if (state.visible && menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let newTop = state.y;
      let newLeft = state.x;

      // Adjust if menu goes off screen vertically
      if (state.y + menuRect.height > viewportHeight) {
        newTop = viewportHeight - menuRect.height - 10; // 10px buffer
      }
      // Adjust if menu goes off screen horizontally
      if (state.x + menuRect.width > viewportWidth) {
        newLeft = viewportWidth - menuRect.width - 10; // 10px buffer
      }

      newTop = Math.max(0, newTop);
      newLeft = Math.max(0, newLeft);

      setAdjustedTop(newTop);
      setAdjustedLeft(newLeft);
    } else if (!state.visible) {
      // Reset positions when not visible to avoid stale values influencing next open
      setAdjustedTop(state.y);
      setAdjustedLeft(state.x);
    }
  }, [state.visible, state.x, state.y]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        hideFileTreeContextMenu();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideFileTreeContextMenu();
      }
    };

    if (state.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [state.visible]);

  if (!state.visible || !state.targetFile) return null;

  return (
    <AnimatePresence>
      {state.visible && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="fixed z-[1000] shadow-lg border rounded-md text-sm"
          style={{
            top: adjustedTop,
            left: adjustedLeft,
            minWidth: '110px',
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.divider,
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on menu itself
        >
          {/* Context Menu Header (File Info) */}
          <Box
            sx={{
              p: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.action.hover,
              maxWidth: '300px',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ color: theme.palette.text.secondary, mb: 0.5 }}
            >
              {state.targetFile.type === 'folder' ? 'Folder' : 'File'}:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                className="text-lg"
                sx={{ color: theme.palette.text.primary }}
              >
                {getFileTypeIcon(
                  state.targetFile.name,
                  state.targetFile.type,
                  state.targetFile.collapsed,
                )}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 'bold',
                  color: theme.palette.text.primary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {state.targetFile.name}
              </Typography>
            </Box>
            <Typography
              variant="caption"
              color="text.disabled"
              className="truncate"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block',
              }}
            >
              {truncateFilePath(state.targetFile.path, 50)}
            </Typography>
          </Box>

          {/* Menu Items */}
          <List component="nav" disablePadding>
            {state.items.map((item, idx) => {
              if (item.type === 'divider') {
                return (
                  <Divider
                    key={idx}
                    sx={{ my: 0.5, borderColor: theme.palette.divider }}
                  />
                );
              }
              if (item.type === 'header') return null; // Header handled separately above

              return (
                <MenuItem
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent issues with parent handlers
                    if (item.action && state.targetFile) {
                      item.action(state.targetFile as FileEntry);
                    }
                    hideFileTreeContextMenu();
                  }}
                  disabled={item.disabled}
                  sx={{
                    px: 2,
                    py: 1.2,
                    color: theme.palette.text.primary,
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                    },
                    '&.Mui-disabled': {
                      opacity: 0.5,
                      cursor: 'not-allowed',
                    },
                  }}
                  className={item.className}
                >
                  {item.icon && (
                    <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                      {item.icon}
                    </ListItemIcon>
                  )}
                  <ListItemText primary={item.label} />
                </MenuItem>
              );
            })}
          </List>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
