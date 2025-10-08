import React from 'react';
import Html5VideoPlayer from '@/components/Html5VideoPlayer';

/**
 * Props for the VideoPlayer component.
 */
type VideoPlayerProps = {
  src: string;
  mediaElementRef: React.MutableRefObject<HTMLMediaElement | null>;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
  onPlayerReady: (htmlMediaElement: HTMLVideoElement) => void;
};

/**
 * `VideoPlayer` is a wrapper around `Html5VideoPlayer` to provide a consistent
 * interface for video playback within the Spotify app. It ensures the underlying
 * HTML5 video element is correctly assigned to the shared `mediaElementRef`.
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  mediaElementRef,
  autoplay = false,
  controls = false,
  loop = false,
  muted = false,
  className = '',
  onPlayerReady,
}) => {
  // Ensure the video element from Html5VideoPlayer is assigned to your shared ref
  const handleReady = (htmlMediaElement: HTMLVideoElement) => {
    mediaElementRef.current = htmlMediaElement; // Set the unified media element ref to the actual video element
    onPlayerReady(htmlMediaElement); // Pass the HTML element up to SpotifyAppPage
  };

  return (
    <Html5VideoPlayer
      src={src}
      autoplay={autoplay}
      controls={controls}
      loop={loop}
      muted={muted}
      className={className}
      onReady={handleReady}
    />
  );
};

export default VideoPlayer;
