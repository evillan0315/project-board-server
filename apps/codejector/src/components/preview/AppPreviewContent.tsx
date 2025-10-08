import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, useTheme, Alert, CircularProgress } from '@mui/material';
import { APP_NAME } from '@/constants';
import { useStore } from '@nanostores/react';
import { appPreviewStore } from '@/stores/appPreviewStore';

interface AppPreviewContentProps {
  iframeRef: React.RefObject<HTMLIFrameElement>; // Pass iframe ref for external control
  onIframeLoad?: () => void;
  onIframeError?: (error: string) => void;
}

const AppPreviewContent: React.FC<AppPreviewContentProps> = ({
  iframeRef,
  onIframeLoad,
  onIframeError,
}) => {
  const theme = useTheme();
  // Read all relevant state directly from the store
  const { currentUrl, screenSize, zoomLevel, useProxy } = useStore(appPreviewStore);
  const [loadingIframe, setLoadingIframe] = useState(true);
  const [iframeLocalError, setIframeLocalError] = useState<string | null>(null);

  // Effect to initialize currentUrl from environment variable if store is empty
  useEffect(() => {
    if (!currentUrl && import.meta.env.VITE_PREVIEW_APP_URL) {
      appPreviewStore.setKey('currentUrl', import.meta.env.VITE_PREVIEW_APP_URL);
    }
  }, [currentUrl]); // Depend on currentUrl from store to trigger initial set if it's empty

  useEffect(() => {
    if (currentUrl) {
      setLoadingIframe(true);
      setIframeLocalError(null);
    } else {
      const errorMsg = 'No preview URL is set. Please set the `VITE_PREVIEW_APP_URL` environment variable or provide a URL in the toolbar.';
      setIframeLocalError(errorMsg);
      setLoadingIframe(false);
      onIframeError?.(errorMsg);
    }
  }, [currentUrl, onIframeError]); // Depend on currentUrl from store

  const handleIframeLoad = () => {
    setLoadingIframe(false);
    try {
      if (iframeRef.current?.contentDocument) {
        console.log('Iframe loaded successfully.');
      } else {
        console.warn(
          'Iframe loaded, but contentDocument is inaccessible (likely CORS or no content).',
        );
      }
    } catch (e: any) {
      console.error('Error accessing iframe content (likely CORS issue):', e);
      const errorMessage = `Failed to access iframe content: ${e.message || 'Possible Cross-Origin Restriction (CORS).'}${useProxy ? '' : ' If the issue persists, try enabling the proxy.'}`;
      setIframeLocalError(errorMessage);
      onIframeError?.(errorMessage);
    }
    onIframeLoad?.();
  };

  const handleIframeError = () => {
    setLoadingIframe(false);
    const errorMessage = 'Failed to load the preview application. Check the URL and server status. If the issue persists, try disabling the proxy.';
    setIframeLocalError(errorMessage);
    onIframeError?.(errorMessage);
  };

  // sx prop for the main Paper wrapper which defines the responsive preview area
  const appPreviewWrapperSx = {
    p: 0,
    bgcolor: theme.palette.background.default,
    color: theme.palette.text.primary,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center', // Center content horizontally within the wrapper
    gap: 2,
    flexShrink: 0, // Prevent shrinking if parent has limited space
    borderRadius: '0 0 6px 6px',
    // Apply responsive width directly to the Paper wrapper
    width: screenSize === 'desktop' ? '100%' : (screenSize === 'tablet' ? '768px' : '375px'),
    height: '100%', // Take full height of its parent (the `Box` in `PreviewAppPage`)
    transition: 'width 0.3s ease-in-out', // Smooth transition for width changes
  };

  // sx prop for the inner Box that contains the iframe
  const iframeContainerSx = {
    width: '100%', // Take full width of its Paper parent
    height: '100%', // Take full height of its Paper parent
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 1,
    overflow: 'hidden',
    position: 'relative',
    transform: `scale(${zoomLevel})`, // Apply zoom level
    transformOrigin: 'top center', // Zoom from the top center
  };

  const loadingOverlaySx = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    bgcolor: theme.palette.background.default,
    zIndex: 10,
  };

  const iframeSrc = useProxy && currentUrl // Use useProxy from store
    ? `${import.meta.env.VITE_API_URL}/proxy?url=${encodeURIComponent(currentUrl)}`
    : currentUrl;

  return (
    <Paper
      id="app-preview-wrapper"
      elevation={1}
      sx={appPreviewWrapperSx}
    >
      {!currentUrl || iframeLocalError ? (
        <Alert severity="error" sx={{ width: '100%', maxWidth: 600 }}>
          <strong>Configuration Error:</strong>{' '}
          {iframeLocalError || (
            <>No preview URL is set. Please set the <code>VITE_PREVIEW_APP_URL</code> environment variable or provide a URL in the toolbar.</>
          )}
        </Alert>
      ) : (
        <Box sx={iframeContainerSx}> {/* This Box now just sizes relative to its Paper parent */}
          {loadingIframe && (
            <Box sx={loadingOverlaySx}>
              <CircularProgress size={40} />
              <Typography
                variant="h6"
                sx={{ mt: 2, color: theme.palette.text.secondary }}
              >
                Loading preview from {currentUrl}...
              </Typography>
            </Box>
          )}
          <iframe
            ref={iframeRef} // Assign ref here
            src={iframeSrc}
            title={`${APP_NAME} Preview`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: loadingIframe ? 'none' : 'block',
            }}
            allow="geolocation; microphone; camera"
          />
        </Box>
      )}
    </Paper>
  );
};

export default AppPreviewContent;
