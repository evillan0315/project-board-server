import React from 'react';
import {
  MenuItem,
  Tooltip,
  CircularProgress,
  useTheme,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { defaultScriptIcon, scriptIcons } from '@/constants/scriptIcons';
import { ScriptStatus } from '@/types';
import { addLog } from '@/stores/logStore';

interface RunScriptMenuItemProps {
  name: string;
  command: string; // The raw script content from package.json, used for the tooltip
  onClick: (scriptName: string, rawScriptContent: string) => void;
  status: ScriptStatus;
  disabled: boolean;
}

/**
 * Represents a menu item for running a package.json script.
 * Displays the script name, an icon, and status (running, success, error).
 * Logs script execution attempts to the `logStore`.
 */
const RunScriptMenuItem: React.FC<RunScriptMenuItemProps> = ({
  name,
  command: rawScriptContent,
  onClick,
  status,
  disabled,
}) => {
  const theme = useTheme();
  const IconComponent = scriptIcons[name] || defaultScriptIcon;

  const isLoading = status === ScriptStatus.RUNNING;

  let textColor = theme.palette.text.primary;
  let iconColor = theme.palette.action.active;
  if (status === ScriptStatus.ERROR) {
    textColor = theme.palette.error.main;
    iconColor = theme.palette.error.main;
  } else if (status === ScriptStatus.SUCCESS) {
    textColor = theme.palette.success.main;
    iconColor = theme.palette.success.main;
  }

  /**
   * Handles the click event for the menu item.
   * Logs the script execution attempt and then calls the provided onClick handler.
   */
  const handleClick = () => {
    addLog(
      'Script Runner',
      `Running script: \`${name}\``,
      'info',
      `Command: ${rawScriptContent}, Current UI Status: ${status}`,
    );
    onClick(name, rawScriptContent);
  };

  return (
    <Tooltip title={`Script: ${rawScriptContent}`} placement="right">
      <MenuItem
        onClick={handleClick} // Use the new handleClick
        disabled={disabled || isLoading}
        sx={{
          minWidth: 150,
          py: 0.5,
          fontSize: '0.875rem',
          color: textColor,
          '&:hover': {
            bgcolor: theme.palette.action.hover,
          },
        }}
      >
        <ListItemIcon sx={{ color: iconColor }}>
          {isLoading ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <IconComponent fontSize="small" />
          )}
        </ListItemIcon>
        <ListItemText
          primary={name}
          primaryTypographyProps={{ style: { color: textColor } }}
        />
      </MenuItem>
    </Tooltip>
  );
};

export default RunScriptMenuItem;
