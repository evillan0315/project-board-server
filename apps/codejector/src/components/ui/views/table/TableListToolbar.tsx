import React from 'react';
import {
  Box,
  Typography,
  Toolbar,
  Tooltip,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { IBulkAction } from './TableList'; // Import IBulkAction

interface TableListToolbarProps {
  numSelected: number;
  searchTerm: string;
  onSearchTermChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBulkActionClick: (actionId: string) => Promise<void> | void;
  bulkActions: IBulkAction[];
  showSearch: boolean;
  showBulkActionsToolbar: boolean;
}

export const TableListToolbar: React.FC<TableListToolbarProps> = ({
  numSelected,
  searchTerm,
  onSearchTermChange,
  onBulkActionClick,
  bulkActions,
  showSearch,
  showBulkActionsToolbar,
}) => {
  return (
    <Box sx={{ bgcolor: 'background.default' }} className="flex flex-col rounded sm:flex-row justify-between items-center mb-4 gap-4 px-2">
      {showSearch && (
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={onSearchTermChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          className="flex-grow max-w-sm w-full sm:w-auto"
        />
      )}

      {showBulkActionsToolbar && (
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            ...(numSelected > 0 && {
              bgcolor: 'background.default',
            }),
            borderRadius: '4px',
            flexShrink: 0,
            minHeight: '48px',
            justifyContent: 'flex-end',
          }}
          className="w-full sm:w-auto"
        >
          {numSelected > 0 && (
            <Typography
              sx={{ flex: '1 1 auto', mr: 2 }}
              color="inherit"
              variant="subtitle1"
              component="div"
            >
              {numSelected} selected
            </Typography>
          )}

          {numSelected > 0 && bulkActions.map((action) => (
            <Tooltip key={action.id} title={action.label}>
              <IconButton color={action.color || 'primary'} onClick={() => onBulkActionClick(action.id)} disabled={action.disabled}>
                {action.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Toolbar>
      )}
    </Box>
  );
};
