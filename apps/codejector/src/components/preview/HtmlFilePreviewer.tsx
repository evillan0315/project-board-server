import React from 'react';
import { Box, Typography, useTheme, CircularProgress, Alert } from '@mui/material';

/**
 * Props for the HtmlFilePreviewer component.
 */
interface HtmlFilePreviewerProps {
  /** The HTML content string to be displayed in the iframe. */
  content: string | null;
  /** Indicates if the content is currently being fetched. */
  isLoading?: boolean;
  /** Any error message encountered while fetching the content. */
  fetchError?: string | null;
}

/**
 * A component for previewing HTML content within a sandboxed iframe.
 * It ensures security by isolating the HTML content from the main application,
 * while allowing necessary functionalities for development previews (e.g., scripts).
 */
const HtmlFilePreviewer: React.FC<HtmlFilePreviewerProps> = ({
  content,
  isLoading = false,
  fetchError = null,
}) => {
  const theme = useTheme();

  // Styles for the iframe itself
  const iframeStyle = {
    width: '100%',
    height: '100%',
    border: 'none',
    backgroundColor: theme.palette.background.paper,
  };

  // Styles for the container Box, ensuring it fills available space
  const containerSx = {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    bgcolor: theme.palette.background.default,
    height: '100%',
    maxHeight: '100%',
    overflowY: 'hidden',
    position: 'relative',
  };

  // Styles for the loading/no content overlay
  const overlaySx = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    bgcolor: theme.palette.background.paper,
    color: theme.palette.text.secondary,
    p: 2,
  };

  return (
    <Box sx={containerSx}>
      {fetchError && (
        <Alert severity="error" sx={{ m: 2 }}>
          {fetchError}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={overlaySx}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 2, mt: 1 }}>
            Loading HTML content...
          </Typography>
        </Box>
      ) : content ? (
        <iframe
          srcDoc={content}
          title="HTML Preview"
          // Sandbox attributes for security. Allows common interactive elements
          // while preventing potentially harmful actions like top-level navigation
          // without user activation. `allow-same-origin` is crucial for relative paths.
          sandbox="allow-downloads allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
          style={iframeStyle}
        />
      ) : (
        <Box sx={overlaySx}>
          <Typography variant="body2">
            No HTML content to display.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default HtmlFilePreviewer;
