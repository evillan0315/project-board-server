import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Menu,
  MenuItem,
  IconButton,
  Typography,
  Chip,
  Fab,
  Grow,
  ViewList,
  ViewModule,
  ViewComfy,
  MoreVert,
} from '@mui/material';

// Types
import { MediaFileResponseDto, FileType } from '@/types/refactored/media';
import { setCurrentTrack, setIsVideoModalOpen } from '@/stores/mediaStore';

import {
  VideoGridItem,
  VideoListItem,
  VideoThumbItem,
  VideoControls,
  VideoDetailDialog,
} from './common';

interface MenuItemType {
  label: string;
  value: string;
  icon: React.ReactElement;
  divider?: boolean;
}

interface VideoListProps {
  videos: MediaFileResponseDto[];
  onFavorite: (videoId: string) => void;
  onAction: (action: string, video: MediaFileResponseDto) => void;
  menuItems?: MenuItemType[];
}

type ViewMode = 'list' | 'grid' | 'thumb';
type SortField = 'title' | 'year' | 'rating' | 'duration';

const VideoList: React.FC<VideoListProps> = ({
  videos,
  onFavorite,
  onAction,
  menuItems = [
    { label: 'Play Trailer', value: 'trailer', icon: <></> },
    {
      label: 'Add to Watchlist',
      value: 'watchlist',
      icon: <></>,
      divider: true,
    },
    { label: 'Download', value: 'download', icon: <></> },
    { label: 'Info', value: 'info', icon: <></> },
  ],
}) => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<MediaFileResponseDto | null>(null);
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Derived data
  const genres = useMemo(() => {
    const allGenres = videos.flatMap((video) => video.video?.cast ?? []);
    return ['all', ...Array.from(new Set(allGenres))];
  }, [videos]);

  const filteredAndSortedVideos = useMemo(
    () =>
      videos
        .filter((video) => {
          const matchesSearch =
            video.video?.title
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            video.video?.description
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            (video.video?.cast &&
              video.video?.cast.some((actor) =>
                actor.toLowerCase().includes(searchQuery.toLowerCase()),
              ));

          const matchesGenre =
            selectedGenre === 'all' ||
            video.video?.cast?.includes(selectedGenre) ||
            false;

          return matchesSearch && matchesGenre;
        })
        .sort((a, b) => {
          const modifier = sortOrder === 'asc' ? 1 : -1;

          if (sortField === 'title') {
            const aValue = a.video ? a.video.title : '';
            const bValue = b.video ? b.video.title : '';

            if (aValue < bValue) return -1 * modifier;
            if (aValue > bValue) return 1 * modifier;
            return 0;
          } else if (sortField === 'year') {
            const aYear = a.video ? a.video.year || 0 : 0;
            const bYear = b.video ? b.video.year || 0 : 0;
            return (aYear - bYear) * modifier;
          } else {
            const aDuration = a.video ? a.video.duration || 0 : 0;
            const bDuration = b.video ? b.video.duration || 0 : 0;
            return (aDuration - bDuration) * modifier;
          }
        }),
    [videos, searchQuery, selectedGenre, sortField, sortOrder],
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

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    video: MediaFileResponseDto,
  ) => {
    setMenuAnchor(event.currentTarget);
    setSelectedVideo(video);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedVideo(null);
  };

  const handleVideoHover = (videoId: string | null) => {
    setHoveredVideo(videoId);
  };

  const handlePlayVideo = useCallback((video: MediaFileResponseDto) => {
    if (video.fileType === FileType.VIDEO) {
      setCurrentTrack(video);
      setIsVideoModalOpen(true);
    } else if (video.fileType === FileType.AUDIO) {
      setCurrentTrack(video);
      setIsVideoModalOpen(false);
    }
  }, []);

  const openDetailDialog = (video: MediaFileResponseDto) => {
    setSelectedVideo(video);
    setDetailDialogOpen(true);
  };

  const closeDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedVideo(null);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Render components
  const renderListItems = () => (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
      {filteredAndSortedVideos.map((video) => (
        <VideoListItem
          key={video.id}
          video={video}
          hoveredVideo={hoveredVideo}
          onPlay={handlePlayVideo}
          onFavorite={onFavorite}
          handleMenuOpen={handleMenuOpen}
          handleVideoHover={handleVideoHover}
          formatDuration={formatDuration}
        />
      ))}
    </Box>
  );

  const renderGridItems = () => (
    <Box>
      {filteredAndSortedVideos.map((video) => (
        <VideoGridItem
          key={video.id}
          video={video}
          hoveredVideo={hoveredVideo}
          openDetailDialog={openDetailDialog}
          onPlay={handlePlayVideo}
          onFavorite={onFavorite}
          handleMenuOpen={handleMenuOpen}
          handleVideoHover={handleVideoHover}
          formatDuration={formatDuration}
        />
      ))}
    </Box>
  );

  const renderThumbItems = () => (
    <Box>
      {filteredAndSortedVideos.map((video) => (
        <VideoThumbItem
          key={video.id}
          video={video}
          hoveredVideo={hoveredVideo}
          openDetailDialog={openDetailDialog}
          onFavorite={onFavorite}
          handleMenuOpen={handleMenuOpen}
          handleVideoHover={handleVideoHover}
          formatDuration={formatDuration}
        />
      ))}
    </Box>
  );

  return (
    <Box>
      {/* Controls */}
      <VideoControls
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedGenre={selectedGenre}
        setSelectedGenre={setSelectedGenre}
        genres={genres}
        sortField={sortField}
        sortOrder={sortOrder}
        handleSortChange={handleSortChange}
        filteredVideoCount={filteredAndSortedVideos.length}
      />

      {/* Content */}
      {filteredAndSortedVideos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No videos found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Try adjusting your search or filter criteria
          </Typography>
        </Box>
      ) : (
        <>
          {viewMode === 'list' && renderListItems()}
          {viewMode === 'grid' && renderGridItems()}
          {viewMode === 'thumb' && renderThumbItems()}
        </>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
      >
        {menuItems.map((item, index) => (
          <MenuItem
            key={item.value}
            onClick={() => selectedVideo && onAction(item.value, selectedVideo)}
            divider={item.divider}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {item.icon}
              <Typography variant="body2">{item.label}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>

      {/* Video Detail Dialog */}
      <VideoDetailDialog
        open={detailDialogOpen}
        onClose={closeDetailDialog}
        selectedVideo={selectedVideo}
        onPlay={handlePlayVideo}
        onFavorite={onFavorite}
        formatDuration={formatDuration}
      />
    </Box>
  );
};

export default VideoList;
