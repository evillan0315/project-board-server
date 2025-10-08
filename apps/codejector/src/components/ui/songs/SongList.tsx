import React, { useState, useMemo } from 'react';
import { Box, Typography, Chip, IconButton } from '@mui/material';
import {
  LibraryMusic,
  ViewList,
  ViewModule,
  ViewComfy,
} from '@mui/icons-material';

import { MediaFileResponseDto } from '@/types/refactored/media';
import { SongListItem } from './SongListItem';
import { SongGridItem } from './SongGridItem';
import { SongThumbItem } from './SongThumbItem';
import { SongListControls } from './SongListControls';

// Types
interface MenuItem {
  label: string;
  value: string;
  icon: React.ReactElement;
  divider?: boolean;
}

interface SongListProps {
  songs: MediaFileResponseDto[];
  onPlay: (song: MediaFileResponseDto) => void;
  onFavorite: (songId: string) => void;
  onAction: (action: string, song: MediaFileResponseDto) => void;
  menuItems?: MenuItem[];
}

type ViewMode = 'list' | 'grid' | 'thumb';
type SortField = 'title' | 'artist' | 'album' | 'duration' | 'year';

const SongList: React.FC<SongListProps> = ({
  songs,
  onPlay,
  onFavorite,
  onAction,
  menuItems = [
    { label: 'Edit', value: 'edit', icon: <></> },
    { label: 'Delete', value: 'delete', icon: <></>, divider: true },
    { label: 'Download Metadata', value: 'download', icon: <></> },
    { label: 'Update Metadata', value: 'update', icon: <></> },
  ],
}) => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  // Derived data
  const genres = useMemo(() => {
    const allGenres: string[] = [];
    songs.forEach((song) => {
      if (song.metadata && song.metadata.length > 0) {
        const genre = song.metadata[0].tags;
        if (genre) {
          allGenres.push(...genre);
        }
      }
    });
    return ['all', ...Array.from(new Set(allGenres))];
  }, [songs]);

  const filteredAndSortedSongs = useMemo(
    () =>
      songs
        .filter((song) => {
          const matchesSearch =
            song.song?.title
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            ''.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ''.toLowerCase().includes(searchQuery.toLowerCase());

          const matchesGenre =
            song.metadata && song.metadata[0] && song.metadata[0].tags
              ? selectedGenre === 'all' ||
                song.metadata[0].tags.includes(selectedGenre)
              : selectedGenre === 'all';

          return matchesSearch && matchesGenre;
        })
        .sort((a, b) => {
          const modifier = sortOrder === 'asc' ? 1 : -1;

          if (sortField === 'duration') {
            return (
              ((a.song?.duration || 0) - (b.song?.duration || 0)) * modifier
            );
          }

          // Handle optional year field
          if (sortField === 'year') {
            const aYear = a.song?.year ?? 0;
            const bYear = b.song?.year ?? 0;
            return (aYear - bYear) * modifier;
          }

          // For string fields (title, artist, album)
          const aValue = a.song ? (a.song.title ?? '') : '';
          const bValue = b.song ? (b.song.title ?? '') : '';

          if (aValue < bValue) return -1 * modifier;
          if (aValue > bValue) return 1 * modifier;
          return 0;
        }),
    [songs, searchQuery, selectedGenre, sortField, sortOrder],
  );

  // Handlers
  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <Box>
      {/* Controls */}
      <SongListControls
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedGenre={selectedGenre}
        setSelectedGenre={setSelectedGenre}
        genres={genres}
        handleSortChange={handleSortChange}
        filteredAndSortedSongs={filteredAndSortedSongs}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Content */}
      {filteredAndSortedSongs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No songs found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filter criteria
          </Typography>
        </Box>
      ) : (
        <>
          {viewMode === 'list' && (
            <Box>
              {filteredAndSortedSongs.map((song) => (
                <SongListItem
                  key={song.id}
                  song={song}
                  onPlay={onPlay}
                  onFavorite={onFavorite}
                  onAction={onAction}
                />
              ))}
            </Box>
          )}
          {viewMode === 'grid' && (
            <Box>
              {filteredAndSortedSongs.map((song) => (
                <SongGridItem
                  key={song.id}
                  song={song}
                  onPlay={onPlay}
                  onFavorite={onFavorite}
                  onAction={onAction}
                />
              ))}
            </Box>
          )}
          {viewMode === 'thumb' && (
            <Box>
              {filteredAndSortedSongs.map((song) => (
                <SongThumbItem
                  key={song.id}
                  song={song}
                  onPlay={onPlay}
                  onFavorite={onFavorite}
                  onAction={onAction}
                />
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default SongList;
