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
import {
  Search,
  LibraryMusic,
  ViewList,
  ViewModule,
  ViewComfy,
} from '@mui/icons-material';

// Types
type ViewMode = 'list' | 'grid' | 'thumb';
type SortField = 'title' | 'artist' | 'album' | 'duration' | 'year';

interface SongListControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedGenre: string;
  setSelectedGenre: (genre: string) => void;
  genres: string[];
  handleSortChange: (field: SortField) => void;
  filteredAndSortedSongs: any[]; // Replace 'any[]' with the correct type if available
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const SongListControls: React.FC<SongListControlsProps> = ({
  searchQuery,
  setSearchQuery,
  selectedGenre,
  setSelectedGenre,
  genres,
  handleSortChange,
  filteredAndSortedSongs,
  viewMode,
  setViewMode,
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
        label="Search songs"
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
          icon={<LibraryMusic />}
          label={`${filteredAndSortedSongs.length} songs`}
          variant="outlined"
          sx={{ mr: 1 }}
        />
        <IconButton onClick={() => handleSortChange('title')}>
          <Typography variant="body2">Title</Typography>
        </IconButton>
        <IconButton onClick={() => handleSortChange('artist')}>
          <Typography variant="body2">Artist</Typography>
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex' }}>
        <IconButton
          onClick={() => setViewMode('list')}
          color={viewMode === 'list' ? 'primary' : 'default'}
        >
          <ViewList />
        </IconButton>
        <IconButton
          onClick={() => setViewMode('grid')}
          color={viewMode === 'grid' ? 'primary' : 'default'}
        >
          <ViewModule />
        </IconButton>
        <IconButton
          onClick={() => setViewMode('thumb')}
          color={viewMode === 'thumb' ? 'primary' : 'default'}
        >
          <ViewComfy />
        </IconButton>
      </Box>
    </Box>
  );
