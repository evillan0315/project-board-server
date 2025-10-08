import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  useTheme,
  LinearProgress,
  Skeleton,
} from '@mui/material';

type LoadingType =
  | 'circular'
  | 'linear'
  | 'dots'
  | 'lines'
  | 'gradient'
  | 'skeleton';

interface LoadingProps {
  type?: LoadingType;
  message?: string;
  className?: string;
  // Props specific to certain types (will be ignored if not applicable)
  size?: number; // For circular, dots, gradient (e.g., 20, 40, 60)
  barHeight?: number; // For linear (e.g., 4, 8)
  skeletonWidth?: number | string; // For skeleton (e.g., '100%', 200)
  skeletonHeight?: number | string; // For skeleton (e.g., 40, 100)
  skeletonVariant?: 'text' | 'rectangular' | 'rounded' | 'circular'; // For skeleton
  skeletonCount?: number; // For skeleton, number of items
}

// Inject custom keyframes for loaders. This is kept local to the component.
const customLoaderStyles = `
  @keyframes pulse { 
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes stretchdelay { 
    0%, 40%, 100% { transform: scaleY(0.4); }
    20% { transform: scaleY(1.0); }
  }

  @keyframes gradientSpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Loading: React.FC<LoadingProps> = ({
  type = 'circular',
  message = 'Loading...',
  className = '',
  size = 60,
  barHeight = 4,
  skeletonWidth = '100%',
  skeletonHeight = 40,
  skeletonVariant = 'rectangular',
  skeletonCount = 3,
}) => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;

  const renderLoader = () => {
    switch (type) {
      case 'linear':
        return (
          <LinearProgress
            sx={{
              width: skeletonWidth,
              height: barHeight,
              borderRadius: 1,
              bgcolor: theme.palette.action.hover,
              '& .MuiLinearProgress-bar': { bgcolor: primaryColor },
            }}
          />
        );
      case 'dots':
        const dotSize = size / 5; // Scale dot size based on overall size prop
        return (
          <Box className="flex space-x-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: dotSize,
                  height: dotSize,
                  bgcolor: primaryColor,
                  borderRadius: '50%',
                  animation: `pulse 1.4s ease-in-out infinite both`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </Box>
        );
      case 'lines':
        const lineWidth = size / 10; // Scale line width
        const lineHeight = size; // Max height
        return (
          <Box
            className="flex justify-between items-end"
            sx={{ width: size, height: lineHeight, overflow: 'hidden' }} // Ensure lines are contained
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: lineWidth,
                  height: '100%',
                  bgcolor: primaryColor,
                  animation: `stretchdelay 1.2s ease-in-out infinite both`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </Box>
        );
      case 'gradient':
        return (
          <Box
            sx={{
              width: size,
              height: size,
              borderRadius: '50%',
              background: `conic-gradient(${primaryColor} 10%, transparent 100%)`,
              animation: 'gradientSpin 1.2s linear infinite',
              display: 'flex', // For centering inner message if any
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* Optional inner circle to hide gradient start if desired */}
            <Box
              sx={{
                position: 'absolute',
                width: size * 0.7,
                height: size * 0.7,
                borderRadius: '50%',
                bgcolor: theme.palette.background.default,
              }}
            />
          </Box>
        );
      case 'skeleton':
        return (
          <Box sx={{ width: skeletonWidth }}>
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <Skeleton
                key={i}
                variant={skeletonVariant}
                width={skeletonWidth}
                height={
                  i === 0 && typeof skeletonHeight === 'number'
                    ? skeletonHeight * 1.5
                    : skeletonHeight
                } // Make first one slightly taller if skeletonHeight is a number
                sx={{ mb: 1, bgcolor: theme.palette.action.selected }} // Use selected for a subtle background
              />
            ))}
          </Box>
        );
      case 'circular':
      default:
        return <CircularProgress size={size} sx={{ color: primaryColor }} />;
    }
  };

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%', // Changed from '100vh' to '100%'
        width: '100%',
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
      }}
      className={className}
    >
      {/* Injecting style for keyframes locally */}
      <style dangerouslySetInnerHTML={{ __html: customLoaderStyles }} />

      {renderLoader()}
      <Typography
        variant="h6"
        sx={{ mt: 3, fontWeight: 'medium', color: theme.palette.text.primary }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default Loading;
