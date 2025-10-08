import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  InputAdornment,
  Typography,
} from '@mui/material';
import { Search } from '@mui/icons-material';

interface VideoControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedGenre: string;
  setSelectedGenre: (genre: string) => void;
  genres: string[];
  sortField: string;
  sortOrder: 'asc' | 'desc';
  handleSortChange: (field: string) => void;
  filteredVideoCount: number;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  searchQuery,
  setSearchQuery,
  selectedGenre,
  setSelectedGenre,
  genres,
  sortField,
  sortOrder,
  handleSortChange,
  filteredVideoCount,
}) => (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        mb: 3,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <TextField
        label="Search videos"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ minWidth: 200, flexGrow: 1 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel>Genre</InputLabel>
        <Select
          value={selectedGenre}
          label="Genre"
          onChange={(e) => setSelectedGenre(e.target.value)}
        >
          {genres.map((genre) => (
            <MenuItem key={genre} value={genre}>
              {genre === 'all' ? 'All Genres' : genre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Chip
          label={`${filteredVideoCount} videos`}
          variant="outlined"
          sx={{ mr: 1 }}
        />
        <IconButton
          onClick={() => handleSortChange('title')}
          color={sortField === 'title' ? 'primary' : 'default'}
        >
          <Typography variant="body2">
            Title {sortField === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Typography>
        </IconButton>
        <IconButton
          onClick={() => handleSortChange('year')}
          color={sortField === 'year' ? 'primary' : 'default'}
        >
          <Typography variant="body2">
            Year {sortField === 'year' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Typography>
        </IconButton>
      </Box>
    </Box>
  );

export default VideoControls;
