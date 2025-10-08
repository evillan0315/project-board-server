import React, { useRef, useEffect } from 'react';
import { Box, Typography, Chip, Paper } from '@mui/material';
import { SyncTranscriptionResponse, TranscriptionResult } from '@/types';

interface TranscriptionHighlightProps {
  syncData: SyncTranscriptionResponse;
  currentTime: number;
  fullTranscription: TranscriptionResult | null;
  onSeek: (time: number) => void;
}

export const TranscriptionHighlight: React.FC<TranscriptionHighlightProps> = ({
  syncData,
  currentTime,
  fullTranscription,
  onSeek,
}) => {
  const { currentSegment, previousSegments, upcomingSegments } = syncData;

  // Ref for the currently highlighted segment to enable auto-scrolling
  const currentSegmentRef = useRef<HTMLDivElement | null>(null);

  // Effect to scroll the current segment into view when it changes
  useEffect(() => {
    if (currentSegmentRef.current && currentSegment) {
      currentSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center', // Centers the element in the scrollable area
      });
    }
  }, [currentSegment?.start]); // Trigger effect when the current segment's start time changes.
                              // This ensures scrolling for distinct segments.

  return (
    <Box>
      {/* Previous Segments */}
      {previousSegments.map((segment, index) => (
        <Typography
          key={`prev-${index}-${segment.start}`} // More robust key
          variant="body1"
          sx={{ mb: 1, opacity: 0.7, cursor: 'pointer' }}
          onClick={() => onSeek(segment.start)}
        >
          {segment.text}
        </Typography>
      ))}

      {/* Current Segment - Highlighted */}
      {currentSegment && (
        <Paper
          ref={currentSegmentRef} // Apply ref here
          elevation={3}
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            cursor: 'pointer',
          }}
          onClick={() => onSeek(currentSegment.start)}
        >
          <Typography variant="body1" fontWeight="bold">
            {currentSegment.text}
          </Typography>
          <Chip
            label={`${currentSegment.start.toFixed(1)}s - ${currentSegment.end.toFixed(1)}s`}
            size="small"
            sx={{
              mt: 1,
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'inherit',
            }}
          />
        </Paper>
      )}

      {/* Upcoming Segments */}
      {upcomingSegments.map((segment, index) => (
        <Typography
          key={`next-${index}-${segment.start}`} // More robust key
          variant="body1"
          sx={{ mb: 1, opacity: 0.5, cursor: 'pointer' }}
          onClick={() => onSeek(segment.start)}
        >
          {segment.text}
        </Typography>
      ))}

      {/* Progress Indicator */}
      {fullTranscription && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Chip
            label={`Current: ${currentTime.toFixed(1)}s / Total: ${fullTranscription.duration.toFixed(1)}s`}
            color="primary"
            variant="outlined"
          />
        </Box>
      )}
    </Box>
  );
};
