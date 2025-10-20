import React from 'react';
import { Box, TextField, Button, MenuItem, IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { RecordingType } from './types/recording';

export interface RecordingSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  typeFilter?: RecordingType | ''; // Allow empty string for 'All'
  onTypeFilterChange?: (value: RecordingType | '') => void; // Allow empty string for 'All'
  typeOptions?: RecordingType[];
  onRefresh: () => void;
}

export const RecordingSearchBar: React.FC<RecordingSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearch,
  typeFilter,
  onTypeFilterChange,
  typeOptions = [],
  onRefresh,
}) => (
    <Box className="flex gap-2 items-center flex-wrap">
      <TextField
        label="Search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        size="small"
        sx={{ minWidth: 200 }}
      />
      {typeOptions.length > 0 && onTypeFilterChange && (
        <TextField
          label="Type"
          select
          value={typeFilter || ''}
          onChange={(e) => onTypeFilterChange(e.target.value as RecordingType | '')}
          size="small"
        >
          <MenuItem value="">All</MenuItem>
          {typeOptions.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </TextField>
      )}
      <Button variant="outlined" onClick={onSearch}>
        Apply
      </Button>
      <Tooltip title="Refresh Recordings">
        <IconButton
          aria-label="refresh recordings"
          onClick={onRefresh}
          color="primary"
        >
          <RefreshIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
