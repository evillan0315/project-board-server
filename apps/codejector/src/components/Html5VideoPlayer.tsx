import React, { useEffect, useRef } from 'react';

interface Html5VideoPlayerProps {
  src: string;
  type?: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  poster?: string;
  className?: string;
  onReady?: (htmlMediaElement: HTMLVideoElement) => void;
  // Add other standard HTMLVideoElement attributes as needed
  [key: string]: any;
}

const Html5VideoPlayer: React.FC<Html5VideoPlayerProps> = ({
  src,
  type = 'video/mp4',
  autoplay = false,
  controls = false,
  loop = false,
  muted = false,
  poster,
  className = '',
  onReady,
  ...rest
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      onReady?.(videoRef.current);
    }
  }, [onReady]); // Only call onReady once when component mounts and ref is set

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay={autoplay}
      controls={controls}
      loop={loop}
      muted={muted}
      poster={poster}
      className={className}
      // Spread any other props directly to the video element
      {...rest}
    >
      <source src={src} type={type} />
      Your browser does not support the video tag.
    </video>
  );
};

export default Html5VideoPlayer;
