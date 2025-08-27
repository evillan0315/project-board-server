import React, { useRef, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';

interface AudioInputVisualizerProps {
  mediaStream: MediaStream | null;
  width?: number;
  height?: number;
  barColor?: string;
  backgroundColor?: string;
  enableSelfPlayback?: boolean; // New prop for self-listening
}

const AudioInputVisualizer: React.FC<AudioInputVisualizerProps> = ({
  mediaStream,
  width = 300,
  height = 50,
  barColor = '#3f51b5',
  backgroundColor = 'rgba(0,0,0,0)',
  enableSelfPlayback = false, // Default to false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null); // For controlling self-playback volume

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    canvasCtx.clearRect(0, 0, width, height);
    canvasCtx.fillStyle = backgroundColor;
    canvasCtx.fillRect(0, 0, width, height);

    analyser.getByteFrequencyData(dataArray);

    const barWidth = (width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] / 2; // Scale height for visual clarity

      canvasCtx.fillStyle = barColor;
      canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }

    animationFrameRef.current = requestAnimationFrame(draw);
  }, [width, height, barColor, backgroundColor]);

  useEffect(() => {
    let isUnmounted = false;

    const cleanupAudio = async () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
      analyserRef.current = null;

      if (audioContextRef.current) {
        try {
          await audioContextRef.current.close();
        } catch (e) {
          console.warn('AudioContext already closed or closing', e);
        }
        audioContextRef.current = null;
      }
    };

    const setupAudio = async () => {
      await cleanupAudio();

      if (!mediaStream || isUnmounted) return;

      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(mediaStream);
        const gainNode = audioContext.createGain(); // Create a gain node

        source.connect(analyser);
        analyser.connect(gainNode); // Connect analyser to gain node

        gainNode.connect(audioContext.destination); // Connect gain node to destination
        gainNode.gain.value = enableSelfPlayback ? 1 : 0; // Set gain based on prop

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        sourceRef.current = source;
        gainNodeRef.current = gainNode; // Store gain node

        draw();
      } catch (e) {
        console.error('Error setting up audio visualizer:', e);
      }
    };

    setupAudio();

    return () => {
      isUnmounted = true;
      cleanupAudio();
    };
  }, [mediaStream, draw, width, height, enableSelfPlayback]);

  // Update gain node value when enableSelfPlayback changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = enableSelfPlayback ? 1 : 0;
    }
  }, [enableSelfPlayback]);

  return (
    <Box
      className="w-full flex justify-center items-center rounded-lg overflow-hidden"
      sx={{ height: height + 20, bgcolor: 'background.paper', border: '1px solid #e0e0e0' }}
    >
      <canvas ref={canvasRef} width={width} height={height} className="rounded-md bg-transparent" />
    </Box>
  );
};

export default AudioInputVisualizer;
