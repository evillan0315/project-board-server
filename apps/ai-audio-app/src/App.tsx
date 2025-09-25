import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Slider, 
  Switch, 
  FormControlLabel,
  Chip,
  LinearProgress,
  ThemeProvider,
  createTheme
} from '@mui/material';
import { PlayArrow, Pause, VolumeUp } from '@mui/icons-material';

// Define TypeScript interfaces
interface AudioFeatures {
  noiseReduction: boolean;
  voiceEnhancement: boolean;
  realtimeTranslation: boolean;
  contentModeration: boolean;
}

interface AudioStats {
  listeners: string;
  audioQuality: string;
  processingDelay: string;
  aiAccuracy: string;
}

// Create a custom dark theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00c9ff',
    },
    secondary: {
      main: '#92fe9d',
    },
    background: {
      default: '#0f2027',
      paper: 'rgba(255, 255, 255, 0.05)',
    },
  },
  typography: {
    h1: {
      background: 'linear-gradient(90deg, #00c9ff, #92fe9d)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontSize: '2.5rem',
      fontWeight: 'bold',
    },
    h2: {
      color: '#00c9ff',
      fontSize: '1.5rem',
      marginBottom: '20px',
    },
  },
});

const App: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.7);
  const [features, setFeatures] = useState<AudioFeatures>({
    noiseReduction: true,
    voiceEnhancement: true,
    realtimeTranslation: false,
    contentModeration: false,
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Stats data
  const stats: AudioStats = {
    listeners: "1,242",
    audioQuality: "96%",
    processingDelay: "47ms",
    aiAccuracy: "89%"
  };

  // Initialize audio visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = (): void => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const initVisualizer = (): void => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    // Simulate audio source
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.1;
    
    oscillator.connect(gainNode);
    gainNode.connect(analyser);
    oscillator.start();
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
  };

  const animate = (): void => {
    if (!analyserRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    analyser.getByteFrequencyData(dataArray);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = (canvas.width / dataArray.length) * 2.5;
    let x = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = dataArray[i] / 2;
      
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, '#00c9ff');
      gradient.addColorStop(1, '#92fe9d');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      
      x += barWidth + 1;
    }
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const startVisualization = (): void => {
    if (!audioContextRef.current) {
      initVisualizer();
    }
    animate();
  };

  const stopVisualization = (): void => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handlePlay = (): void => {
    setIsPlaying(true);
    startVisualization();
  };

  const handlePause = (): void => {
    setIsPlaying(false);
    stopVisualization();
  };

  const handleVolumeChange = (event: Event, newValue: number | number[]): void => {
    setVolume(Array.isArray(newValue) ? newValue[0] : newValue);
  };

  const handleFeatureToggle = (feature: keyof AudioFeatures): void => {
    setFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
          color: '#fff',
          padding: '20px',
          width: '100%',
        }}
      >
        <Box className="" >
          <Box sx={{ textAlign: 'center', py: 4, mb: 4 }}>
            <Typography variant="h1" gutterBottom>
              AI Live Audio Stream
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#a0a0a0', fontSize: '1.2rem' }}>
              Real-time audio processing with artificial intelligence
            </Typography>
          </Box>

          <Grid  container className="mx-auto w-full justify-center" spacing={4}>
            <Grid item sm={12} md={6}>
              <Card sx={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                borderRadius: '15px', 
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                padding: 3
              }}>
                <CardContent>
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h2" gutterBottom>
                      Stream Controls 
                      <Chip 
                        label="LIVE" 
                        sx={{ 
                          ml: 1, 
                          backgroundColor: '#e74c3c', 
                          color: 'white',
                          animation: 'pulse 1.5s infinite',
                          '@keyframes pulse': {
                            '0%': { opacity: 1 },
                            '50%': { opacity: 0.5 },
                            '100%': { opacity: 1 },
                          }
                        }} 
                      />
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                      <Button
                        variant="contained"
                        onClick={handlePlay}
                        disabled={isPlaying}
                        sx={{
                          flex: 1,
                          borderRadius: '50px',
                          background: 'linear-gradient(90deg, #00c9ff, #92fe9d)',
                          color: '#0f2027',
                          fontWeight: 'bold',
                          py: 1.5,
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: '0 5px 15px rgba(0, 201, 255, 0.4)',
                          },
                        }}
                      >
                        <PlayArrow sx={{ mr: 1 }} />
                        {isPlaying ? 'Streaming...' : 'Play Stream'}
                      </Button>
                      
                      <Button
                        variant="outlined"
                        onClick={handlePause}
                        disabled={!isPlaying}
                        sx={{
                          flex: 1,
                          borderRadius: '50px',
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          color: 'white',
                          py: 1.5,
                          '&:hover': {
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                          },
                        }}
                      >
                        <Pause sx={{ mr: 1 }} />
                        Pause
                      </Button>
                    </Box>
                    
                    <Box sx={{ mt: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <VolumeUp sx={{ mr: 1, color: '#00c9ff' }} />
                        <Typography>Volume Control</Typography>
                      </Box>
                      <Slider
                        value={volume}
                        onChange={handleVolumeChange}
                        min={0}
                        max={1}
                        step={0.01}
                        sx={{
                          color: '#00c9ff',
                          '& .MuiSlider-thumb': {
                            width: 20,
                            height: 20,
                            backgroundColor: '#00c9ff',
                          },
                        }}
                      />
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="h2" gutterBottom>
                      AI Enhancements
                    </Typography>
                    
                    <Box>
                      {[
                        { key: 'noiseReduction', label: 'Noise Reduction' },
                        { key: 'voiceEnhancement', label: 'Voice Enhancement' },
                        { key: 'realtimeTranslation', label: 'Real-time Translation' },
                        { key: 'contentModeration', label: 'Content Moderation' },
                      ].map((feature) => (
                        <FormControlLabel
                          key={feature.key}
                          control={
                            <Switch
                              checked={features[feature.key as keyof AudioFeatures]}
                              onChange={() => handleFeatureToggle(feature.key as keyof AudioFeatures)}
                              sx={{
                                width: 60,
                                height: 30,
                                padding: 0,
                                '& .MuiSwitch-switchBase': {
                                  padding: 1,
                                  '&.Mui-checked': {
                                    transform: 'translateX(30px)',
                                    color: '#fff',
                                    '& + .MuiSwitch-track': {
                                      background: 'linear-gradient(90deg, #00c9ff, #92fe9d)',
                                      opacity: 1,
                                    },
                                  },
                                },
                                '& .MuiSwitch-thumb': {
                                  width: 22,
                                  height: 22,
                                },
                                '& .MuiSwitch-track': {
                                  borderRadius: 34,
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  opacity: 1,
                                },
                              }}
                            />
                          }
                          label={feature.label}
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            mb: 2,
                            '& .MuiFormControlLabel-label': {
                              color: 'white'
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    mt: 3, 
                    p: 2, 
                    background: 'rgba(0, 201, 255, 0.1)', 
                    borderRadius: '10px' 
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: '#00c9ff',
                          mr: 1,
                          animation: 'blink 1s infinite',
                          '@keyframes blink': {
                            '0%': { opacity: 1 },
                            '50%': { opacity: 0.3 },
                            '100%': { opacity: 1 },
                          }
                        }}
                      />
                      <Typography variant="body2">
                        AI is processing audio in real-time
                      </Typography>
                    </Box>
                    <LinearProgress 
                      sx={{ 
                        mt: 1, 
                        backgroundColor: 'rgba(0, 201, 255, 0.2)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #00c9ff, #92fe9d)',
                        }
                      }} 
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                borderRadius: '15px', 
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                padding: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h2" gutterBottom>
                    Audio Visualization
                  </Typography>
                  
                  <Box sx={{ 
                    flex: 1, 
                    background: 'rgba(0, 0, 0, 0.2)', 
                    borderRadius: '10px', 
                    overflow: 'hidden',
                    mb: 3
                  }}>
                    <canvas 
                      ref={canvasRef} 
                      style={{ 
                        width: '100%', 
                        height: '200px', 
                        display: 'block' 
                      }} 
                    />
                  </Box>
                  
                  <Grid container spacing={2}>
                    {Object.entries(stats).map(([key, value]) => (
                      <Grid item xs={6} key={key}>
                        <Box sx={{ 
                          background: 'rgba(255, 255, 255, 0.05)', 
                          padding: 2, 
                          borderRadius: '10px', 
                          textAlign: 'center' 
                        }}>
                          <Typography variant="body2" sx={{ color: '#a0a0a0' }}>
                            {key.split(/(?=[A-Z])/).join(' ')}
                          </Typography>
                          <Typography variant="h4" sx={{ color: '#00c9ff', my: 1 }}>
                            {value}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;