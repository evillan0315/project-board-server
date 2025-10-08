import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  IconButton,
  SxProps,
  Theme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VideoPlayer from '@/pages/spotify/VideoPlayer';

// Define the size type
type VideoModalSize = 'normal' | 'medium' | 'large' | 'fullscreen';

// Interface for VideoModalProps
interface VideoModalProps {
  open: boolean;
  onClose: () => void;
  src: string;
  mediaElementRef?: React.MutableRefObject<
    HTMLVideoElement | HTMLImageElement | null
  >;
  autoplay?: boolean; // Make optional, usually true for videos in modals
  controls?: boolean; // Make optional, usually true for videos in modals
  muted?: boolean; // Make optional, usually true for autoplay
  onPlayerReady?: (htmlMediaElement: HTMLVideoElement) => void;
  mediaType: 'video' | 'gif' | 'image';
  size?: VideoModalSize; // Add the new size prop, make it optional
}

// Helper function to get the modal width based on size
const getModalWidthSx = (size: VideoModalSize): SxProps<Theme> => {
  let width: string;
  const maxWidth: string = 'none'; // Override default maxWidth from Dialog
  let maxHeight: string = '90vh'; // Max height to ensure it fits on screen, leaving some margin

  switch (size) {
    case 'normal':
      width = '25vw';
      break;
    case 'medium':
      width = '50vw';
      break;
    case 'large':
      width = '75vw';
      break;
    case 'fullscreen':
      width = '100vw';
      maxHeight = '100vh'; // Fullscreen should take full height
      break;
    default:
      // Fallback or default behavior, should not be hit with good typing
      width = '75vw'; // Equivalent to 'large'
      break;
  }

  return {
    width,
    maxWidth,
    maxHeight,
    bgcolor: 'transparent',
    boxShadow: 'none',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
};

const VideoModal: React.FC<VideoModalProps> = ({
  open,
  onClose,
  src,
  mediaElementRef,
  autoplay = true, // Default to true for modal videos
  controls = true, // Default to true for modal videos
  muted = true, // Default to true for modal videos
  onPlayerReady,
  mediaType,
  size = 'large', // Default size to 'large'
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    onBackdropClick={() => {}} // Disable closing on outside click
    disableEscapeKeyDown={true} // Disable closing on Escape key press
    fullWidth={false} // Disable MUI's fullWidth behavior
    maxWidth={false} // Disable MUI's maxWidth breakpoints
    PaperProps={{
      sx: getModalWidthSx(size), // Apply dynamic width styles here
    }}
    sx={{
      '& .MuiDialog-container': {
        alignItems: 'center',
        justifyContent: 'center',
      },
      '& .MuiBackdrop-root': {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
      },
    }}
  >
    <DialogContent
      sx={{ p: 0, position: 'relative', width: '100%', height: '100%' }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {mediaType === 'video' ? (
          <VideoPlayer
            src={src}
            mediaElementRef={
              mediaElementRef as React.MutableRefObject<HTMLVideoElement | null>
            }
            autoplay={autoplay}
            controls={controls}
            loop={false}
            muted={muted}
            className="w-full h-full object-contain aspect-video" // ADDED aspect-video
            onPlayerReady={onPlayerReady}
          />
        ) : mediaType === 'gif' ? (
          <img
            src={src}
            alt="Animated GIF"
            className="w-full h-full object-contain aspect-auto" // ADDED aspect-auto
            ref={
              mediaElementRef as React.MutableRefObject<HTMLImageElement | null>
            }
            // GIFs autoplay by default, controls/muted are not applicable
          />
        ) : (
          <img
            src={src}
            alt="Captured Screenshot"
            className="w-full h-full object-contain aspect-auto" // ADDED aspect-auto
            ref={
              mediaElementRef as React.MutableRefObject<HTMLImageElement | null>
            }
          />
        )}

        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.7)',
            },
            zIndex: 100,
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    </DialogContent>
  </Dialog>
);

export default VideoModal;
