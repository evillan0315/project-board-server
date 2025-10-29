import React from 'react';
import { useStore } from '@nanostores/react';
import { Menu, MenuItem, ListItemIcon, ListItemText, Divider, Typography, Box, useTheme } from '@mui/material';
import { codeMirrorContextMenuStore, hideCodeMirrorContextMenu } from './stores/codeMirrorContextMenuStore';
import { ICodeMirrorContextMenuItem } from './types';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import { EditorView } from '@codemirror/view';
interface CodeMirrorContextMenuProps {
  editorView: EditorView | null;
}
const CodeMirrorContextMenu: React.FC<CodeMirrorContextMenuProps> = ({ editorView }) => {
  const { visible, x, y, items } = useStore(codeMirrorContextMenuStore);
  const theme = useTheme();
  const handleClose = () => {
    hideCodeMirrorContextMenu();
  };
  const handleItemClick = (item: ICodeMirrorContextMenuItem) => {
    if (editorView && item.onClick) {
      item.onClick(editorView);
    }
    handleClose();
  };
  const sxMenuPaper = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[3],
    maxHeight: 'calc(100vh - 100px)',
    minWidth: 200,
    '& .MuiList-root': {
      padding: theme.spacing(0.5, 0),
    },
  };
  const sxMenuItem = {
    minHeight: theme.spacing(4),
    py: 0.5,
    px: 1.5,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&.Mui-disabled': {
      opacity: 0.6,
    },
  };
  const sxListItemIcon = {
    minWidth: 32,
    color: theme.palette.text.secondary,
  };
  const sxListItemText = {
    '& .MuiTypography-root': {
      fontSize: '0.875rem',
    },
  };
  const sxHeader = {
    px: 1.5,
    py: 0.5,
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: theme.palette.text.disabled,
    textTransform: 'uppercase',
  };
  if (!visible) {
    return null;
  }
  return (
    <Menu
      open={visible}
      onClose={handleClose}
      anchorReference="anchorPosition"
      anchorPosition={{ top: y, left: x }}
      PaperProps={{
        sx: sxMenuPaper,
      }}
      MenuListProps={{
        dense: true,
      }}
    >
      {items.map((item, index) => {
        if (item.isDivider) {
          return <Divider key={`divider-${index}`} sx={{ my: 0.5 }} />;
        }
        if (item.isHeader) {
          return (
            <Typography key={`header-${index}`} sx={sxHeader}>
              {item.headerLabel || item.label}
            </Typography>
          );
        }
        return (
          <MenuItem
            key={item.id}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            sx={sxMenuItem}
          >
            {item.icon && <ListItemIcon sx={sxListItemIcon}>{item.icon}</ListItemIcon>}
            <ListItemText sx={sxListItemText}>{item.label}</ListItemText>
          </MenuItem>
        );
      })}
    </Menu>
  );
};
export default CodeMirrorContextMenu;
