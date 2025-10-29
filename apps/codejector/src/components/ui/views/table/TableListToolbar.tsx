import React, { ReactNode, SyntheticEvent } from 'react';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';

import GlobalActionButton from '@/components/ui/GlobalActionButton';
import { GlobalAction } from '@/types/app';

/**
 * @interface FilterOption
 * @description Defines the structure for a filter option in the dropdown.
 * @property {string | number | ''} value - The unique value of the filter option.
 * @property {string} label - The display label for the filter option.
 */
export interface FilterOption {
  value: string | number | '';
  label: string;
}

/**
 * @interface TableListToolbarProps
 * @description Props for the TableListToolbar component.
 * @property {string} [title] - Optional title displayed on the left of the toolbar.
 * @property {string} searchQuery - The current search query string.
 * @property {(query: string) => void} onSearchChange - Callback for when the search query changes.
 * @property {() => void} onApplySearch - Callback to trigger the search action (e.g., when Enter is pressed or button clicked).
 * @property {string | number | ''} [filterBy] - The currently selected filter value.
 * @property {(value: string | number | '') => void} [onFilterChange] - Callback for when the filter value changes.
 * @property {FilterOption[]} [filterOptions] - Array of options for the filter dropdown.
 * @property {() => void} [onRefresh] - Optional callback to trigger a refresh action (adds a default refresh button).
 * @property {GlobalAction[]} [leftActions] - Optional array of GlobalActions to display on the left.
 * @property {GlobalAction[]} [rightActions] - Optional array of GlobalActions to display on the right.
 * @property {boolean} [showSearch=true] - Whether to show the search input.
 * @property {boolean} [showFilter=true] - Whether to show the filter dropdown.
 * @property {boolean} [showTitle=true] - Whether to show the title text.
 */
export interface TableListToolbarProps {
  title?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onApplySearch: () => void;
  filterBy?: string | number | '';
  onFilterChange?: (value: string | number | '') => void;
  filterOptions?: FilterOption[];
  onRefresh?: () => void;
  leftActions?: GlobalAction[];
  rightActions?: GlobalAction[];
  showSearch?: boolean;
  showFilter?: boolean;
  showTitle?: boolean;
}

const TableListToolbar: React.FC<TableListToolbarProps> = ({
  title,
  searchQuery,
  onSearchChange,
  onApplySearch,
  filterBy,
  onFilterChange,
  filterOptions,
  onRefresh,
  leftActions,
  rightActions,
  showSearch = true,
  showFilter = true,
  showTitle = true,
}) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onApplySearch();
    }
  };

  // Combine default refresh with any provided rightActions
  const finalRightActions: GlobalAction[] = [];
  if (onRefresh) {
    finalRightActions.push({
      id: 'refresh',
      label: 'Refresh',
      icon: <RefreshIcon />,
      action: onRefresh,
      tooltip: 'Refresh list',
      disabled: false,
    });
  }
  if (rightActions) {
    finalRightActions.push(...rightActions);
  }

  return (
    <Box className="flex items-center justify-between p-4 border-b border-divider bg-background-paper sticky top-0 z-10">
      <Box className="flex items-center gap-2">
        {showTitle && title && (
          <Typography variant="h6" component="div" className="font-bold whitespace-nowrap">
            {title}
          </Typography>
        )}
        {leftActions && leftActions.length > 0 && (
          <GlobalActionButton globalActions={leftActions} iconOnly={true} />
        )}
      </Box>

      <Box className="flex items-center gap-2">
        {showSearch && (
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button onClick={onApplySearch} size="small" variant="text">
                    Apply
                  </Button>
                </InputAdornment>
              ),
            }}
            className="min-w-[200px]"
          />
        )}

        {showFilter && filterOptions && filterOptions.length > 0 && onFilterChange && (
          <TextField
            label="Filter by Type"
            select
            variant="outlined"
            size="small"
            value={filterBy || ''}
            onChange={(e) => onFilterChange(e.target.value as string)}
            className="min-w-[120px]"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FilterListIcon />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="">All</MenuItem>
            {filterOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        )}

        {finalRightActions.length > 0 && (
          <GlobalActionButton globalActions={finalRightActions} iconOnly={true} />
        )}
      </Box>
    </Box>
  );
};

export { TableListToolbar };
