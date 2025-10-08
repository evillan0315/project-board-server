import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Box, useTheme } from '@mui/material';
import { useStore } from '@nanostores/react';
import { $mediaStore, isPlayingAtom } from '@/stores/mediaStore';
import { FileType } from '@/types/refactored/media';

interface AudioVisualizerProps {
  canvasHeight?: number;
  canvasWidth?: number;
  barWidthBuffer?: number;
  barHeightBuffer?: number;
  // No props needed as it accesses the global store directly
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({canvasHeight=40,canvasWidth=70, barWidthBuffer=0.5, barHeightBuffer=8}) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const { mediaElement, currentTrack } = useStore($mediaStore);
  const isPlaying = useStore(isPlayingAtom);

  const [canvasDimensions, setCanvasDimensions] = useState({ width: canvasWidth, height: canvasHeight });

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const parent = canvas.parentElement;
      if (parent) {
        setCanvasDimensions({
          width: parent.clientWidth,
          height: parent.clientHeight,
        });
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const setupAudioContext = useCallback(() => {
    if (!mediaElement || !canvasRef.current) return;

    // Only create/resume AudioContext if the user has interacted with the document
    // or if the browser allows autoplay with sound.
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;

    if (sourceNodeRef.current && sourceNodeRef.current.mediaElement !== mediaElement) {
      // Disconnect old source if mediaElement changed
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (!sourceNodeRef.current) {
      sourceNodeRef.current = audioContext.createMediaElementSource(mediaElement);
    }

    if (!analyserRef.current) {
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256; // Smaller FFT size for faster animation
      // analyserRef.current.smoothingTimeConstant = 0.8; // Optional smoothing
    }

    sourceNodeRef.current.connect(analyserRef.current);
    analyserRef.current.connect(audioContext.destination);

    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      // Do not close AudioContext here, it might be needed by other components.
      // It should ideally be managed globally or carefully suspended/resumed.
    };
  }, [mediaElement]);

  useEffect(() => {
    // Re-setup audio context if media element changes or gets initialized
    const cleanup = setupAudioContext();
    return cleanup;
  }, [setupAudioContext]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !analyser || !ctx) {
      animationFrameId.current = null;
      return; // Stop animation if essentials are missing
    }

    animationFrameId.current = requestAnimationFrame(draw);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * barWidthBuffer;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] / barHeightBuffer; // Scale height for visualization
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, theme.palette.primary.light);
      gradient.addColorStop(0.5, theme.palette.success.main);
      gradient.addColorStop(1, theme.palette.primary.dark);
      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

      x += barWidth + 0.3; // Add padding between bars
    }
  }, [theme.palette]);

  useEffect(() => {
    if (isPlaying ) {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume().catch(e => console.error("Failed to resume AudioContext:", e));
      }
      if (animationFrameId.current === null) {
        draw();
      }
    } else {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      if (audioContextRef.current?.state === 'running') {
        audioContextRef.current.suspend().catch(e => console.error("Failed to suspend AudioContext:", e));
      }
    }

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [isPlaying, draw]);

  // Handle AudioContext resume on user gesture if needed (common browser policy)
  useEffect(() => {
    const resumeAudioContextOnGesture = () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(e => console.error("Failed to resume AudioContext on user gesture:", e));
      }
    };
    // Attach to common user interaction events for better compatibility
    document.addEventListener('click', resumeAudioContextOnGesture);
    document.addEventListener('keydown', resumeAudioContextOnGesture);
    return () => {
      document.removeEventListener('click', resumeAudioContextOnGesture);
      document.removeEventListener('keydown', resumeAudioContextOnGesture);
    };
  }, []);

  return (
    <Box
      sx={{
        //width: '100%',
        height: '40px', // Dedicated height for the visualizer
        display: isPlaying ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        bgcolor: theme.palette.background.paper, // Match main background for visual integration
        borderRadius: '4px',
        mt: 0.5, // Margin top to separate from the top edge slightly
        mb: 0.5, // Margin bottom to separate from controls
      }}
      className='AudioVisualizer-wrapper'
    >
      <canvas ref={canvasRef} width={canvasDimensions.width} height={canvasDimensions.height} />
    </Box>
  );
};

export default AudioVisualizer;
