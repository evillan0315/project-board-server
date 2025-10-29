import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Box, useTheme } from '@mui/material';
import { useStore } from '@nanostores/react';
import { $mediaStore, isPlayingAtom, currentTrackAtom } from '@/stores/mediaStore';
import { FileType } from '@/types/refactored/media';

interface AudioVisualizerProps {
  // No props needed as it accesses the global store directly and manages its own dimensions
}

// Define default constants for visualizer bar rendering
const DEFAULT_CANVAS_HEIGHT = 30;
const DEFAULT_CANVAS_WIDTH = 100; // This will be overridden by parent clientWidth
const DEFAULT_BAR_WIDTH_BUFFER = 0.5;
const DEFAULT_BAR_HEIGHT_BUFFER = 8;
const PADDING_BETWEEN_BARS = 0.3; // Added constant for clarity

const AudioVisualizer: React.FC<AudioVisualizerProps> = () => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const { mediaElement } = useStore($mediaStore);
  const isPlaying = useStore(isPlayingAtom);
  const currentTrack = useStore(currentTrackAtom);

  const [canvasDimensions, setCanvasDimensions] = useState({
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
  });

  // Derived state to determine if the visualizer should be active
  const isAudioTrack = currentTrack?.fileType === FileType.AUDIO;
  const isVisualizerActive = isPlaying; // Simplified conditional logic

  // Memoized drawing function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const ctx = canvas?.getContext('2d');

    // If conditions are not met (e.g., visualizer not active, or essential refs missing), stop the animation
    if (!canvas || !analyser || !ctx || !isVisualizerActive) {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      return; // Stop animation if essentials are missing or not active
    }

    animationFrameId.current = requestAnimationFrame(draw);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * DEFAULT_BAR_WIDTH_BUFFER;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] / DEFAULT_BAR_HEIGHT_BUFFER; // Scale height for visualization
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, theme.palette.primary.light);
      gradient.addColorStop(0.5, theme.palette.success.main);
      gradient.addColorStop(1, theme.palette.primary.dark);
      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

      x += barWidth + PADDING_BETWEEN_BARS; // Add padding between bars
    }
  }, [theme.palette, isVisualizerActive]); // Dependency on isVisualizerActive ensures immediate stop/start

  // Handles canvas resizing to fit its parent
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const parent = canvas.parentElement;
      if (parent) {
        // Only update if dimensions actually change to prevent unnecessary re-renders
        if (parent.clientWidth !== canvas.width || parent.clientHeight !== canvas.height) {
          setCanvasDimensions({
            width: parent.clientWidth,
            height: parent.clientHeight,
          });
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight;
        }
      }
    }
  }, []);

  // Effect for setting up and tearing down the audio analysis graph
  useEffect(() => {
    // If visualizer is not active (not playing or not an audio track), clean up resources
    if (!isVisualizerActive) {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend().catch(e => console.error("Failed to suspend AudioContext on cleanup:", e));
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
      // Do NOT close AudioContext here, it might be shared or needed again.
      return; // Exit early if not active
    }

    // Visualizer is active, proceed with setup
    if (!mediaElement || !canvasRef.current) {
      // Media element not ready, ensure no animation is running
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      return; // Media element must be available to proceed
    }

    // Initialize AudioContext if not already done
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;

    // Resume context if suspended, often required by browsers
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(e => console.error("Failed to resume AudioContext:", e));
    }

    // Setup MediaElementAudioSourceNode
    // Re-create source node if mediaElement has changed to ensure it's connected to the current media
    if (!sourceNodeRef.current || sourceNodeRef.current.mediaElement !== mediaElement) {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      sourceNodeRef.current = audioContext.createMediaElementSource(mediaElement);
    }

    // Setup AnalyserNode
    if (!analyserRef.current) {
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256; // Smaller FFT size for faster animation
      analyserRef.current.smoothingTimeConstant = 0.8; // Added smoothing for a less jumpy visual
    }

    // Connect the audio graph if not already fully connected
    // This check is a simplification; a more robust solution might involve specific `disconnect` calls if nodes are reused.
    // For typical usage, reconnecting if `sourceNodeRef` or `analyserRef` were just created/re-created is sufficient.
    if (sourceNodeRef.current && analyserRef.current) {
      // Disconnect if previously connected to different nodes or if graph needs resetting
      // (Simplified: assuming fresh connection each time if source/analyser were just re-initialized)
      sourceNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContext.destination);
    }

    // Start drawing loop only if not already running
    if (animationFrameId.current === null) {
      draw();
    }

    // Cleanup function for this useEffect
    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend().catch(e => console.error("Failed to suspend AudioContext on cleanup:", e));
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
    };
  }, [isVisualizerActive, mediaElement, draw]); // Dependencies for setup and cleanup logic

  // Effect for initial canvas resize and event listener for window resize
  useEffect(() => {
    resizeCanvas(); // Initial resize when component mounts
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Handle AudioContext resume on user gesture (standard browser policy)
  useEffect(() => {
    const resumeAudioContextOnGesture = () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(e => console.error("Failed to resume AudioContext on user gesture:", e));
      }
    };
    // Attach to common user interaction events for better compatibility
    document.addEventListener('click', resumeAudioContextOnGesture);
    document.addEventListener('keydown', resumeAudioContextOnGesture);
    document.addEventListener('touchstart', resumeAudioContextOnGesture); // Add touch for mobile devices
    return () => {
      document.removeEventListener('click', resumeAudioContextOnGesture);
      document.removeEventListener('keydown', resumeAudioContextOnGesture);
      document.removeEventListener('touchstart', resumeAudioContextOnGesture);
    };
  }, []);

  return (
    <Box
      sx={{
        height: '30px', // Dedicated height for the visualizer
        display: isVisualizerActive ? 'flex' : 'none', // Only display if active
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        bgcolor: theme.palette.background.paper, // Match main background for visual integration
        borderRadius: '4px',
        mt: 0.5, // Margin top to separate from the top edge slightly
        mb: 0.5, // Margin bottom to separate from controls
        width: '100px',
      }}
      className='AudioVisualizer-wrapper'
    >
      <canvas ref={canvasRef} className={`min-w-[${DEFAULT_CANVAS_WIDTH}px] min-h-[${DEFAULT_CANVAS_HEIGHT}px]`} width={canvasDimensions.width} height={canvasDimensions.height} />
    </Box>
  );
};

export default AudioVisualizer;
