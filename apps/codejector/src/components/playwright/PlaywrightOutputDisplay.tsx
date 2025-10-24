import React from 'react';
import { Box, Paper, Typography, Alert, CircularProgress, Link } from '@mui/material';
import { useStore } from '@nanostores/react';
import { playwrightStore } from './stores/playwrightStore';
import type { IPlaywrightOutputDto, IFrontendLlmOutputPlayDto } from './types/IPlaywrightTypes';
import ReactMarkdownWithCodeCopy from '@/components/markdown/ReactMarkdownWithCodeCopy';
import { getFileStreamUrl } from '@/api/media'; // Import getFileStreamUrl

interface PlaywrightOutputDisplayProps {
  results: IPlaywrightOutputDto | null;
  loading: boolean;
  error: string | null;
}

const outputDisplayStyles = {
  paper: {
    p: 3,
    mt: 3,
    backgroundColor: 'background.paper',
    borderRadius: 2,
    boxShadow: 3,
  },
  heading: {
    mb: 2,
    color: 'primary.main',
  },
  subHeading: {
    mt: 2,
    mb: 1,
    color: 'text.secondary',
  },
  codeBlock: {
    backgroundColor: 'grey.900',
    color: 'white',
    p: 2,
    borderRadius: 1,
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontFamily: 'monospace',
  },
  image: {
    maxWidth: '100%',
    height: 'auto',
    mt: 2,
    border: '1px solid #ddd',
    borderRadius: 1,
  },
  video: {
    maxWidth: '100%',
    height: 'auto',
    mt: 2,
    borderRadius: 1,
    backgroundColor: 'black',
  },
};

const PlaywrightOutputDisplay: React.FC<PlaywrightOutputDisplayProps> = ({ results, loading, error }) => {
  const {
    activeRecording,
    recordingFileName,
    recordingDuration,
  } = useStore(playwrightStore);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Performing Playwright operation...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        Error: {error}
      </Alert>
    );
  }

  if (activeRecording) {
    return (
      <Alert severity="info" sx={{ mt: 4 }}>
        Recording in progress for {recordingDuration ? `${recordingDuration} seconds` : 'indefinitely'} (File: {recordingFileName})
      </Alert>
    );
  } 

  if (!results || !results.success) {
    return null; // Or a message indicating no results yet
  }

  const renderGeminiAnalysis = (analysis: IFrontendLlmOutputPlayDto | undefined) => {
    if (!analysis) return null;
    return (
      <Box>
        <Typography variant="h6" sx={outputDisplayStyles.subHeading}>AI Analysis</Typography>
        {analysis.title && <Typography variant="subtitle1">Title: {analysis.title}</Typography>}
        {analysis.summary && <Typography variant="body1" sx={{ mt: 1 }}>Summary: {analysis.summary}</Typography>}
        {analysis.thoughtProcess && (
          <Box mt={2}>
            <Typography variant="subtitle1">Thought Process:</Typography>
            <ReactMarkdownWithCodeCopy markdown={analysis.thoughtProcess} />
          </Box>
        )}
        {analysis.documentation && (
          <Box mt={2}>
            <Typography variant="subtitle1">Documentation:</Typography>
            <ReactMarkdownWithCodeCopy markdown={analysis.documentation} />
          </Box>
        )}
        {/* Add more fields from LlmOutputDto as needed */}
        {analysis.imageAnalysis && (
          <Box mt={2}>
            <Typography variant="subtitle1">Image Analysis:</Typography>
            <pre style={outputDisplayStyles.codeBlock}>{JSON.stringify(analysis.imageAnalysis, null, 2)}</pre>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Paper sx={outputDisplayStyles.paper} className="shadow-lg">
      <Typography variant="h5" sx={outputDisplayStyles.heading}>Playwright Operation Results</Typography>
      {results.errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Operation Failed: {results.errorMessage}
        </Alert>
      )}

      {results.scrapedText && (
        <Box>
          <Typography variant="h6" sx={outputDisplayStyles.subHeading}>Scraped Text</Typography>
          <pre style={outputDisplayStyles.codeBlock}>{results.scrapedText}</pre>
        </Box>
      )}

      {results.scrapedHtml && (
        <Box>
          <Typography variant="h6" sx={outputDisplayStyles.subHeading}>Scraped HTML</Typography>
          {/* Using dangerouslySetInnerHTML for raw HTML. In a real app, consider sandboxing or careful sanitization. */}
          <Box sx={outputDisplayStyles.codeBlock} dangerouslySetInnerHTML={{ __html: results.scrapedHtml }} />
        </Box>
      )}

      {results.screenshotBase64 && (
        <Box>
          <Typography variant="h6" sx={outputDisplayStyles.subHeading}>Screenshot</Typography>
          <img
            src={`data:image/png;base64,${results.screenshotBase64}`}
            alt="Screenshot"
            style={outputDisplayStyles.image}
          />
        </Box>
      )}

      {results.recordedVideoPath && (
        <Box>
          <Typography variant="h6" sx={outputDisplayStyles.subHeading}>Recorded Video</Typography>
          <video controls src={getFileStreamUrl(results.recordedVideoPath)} style={outputDisplayStyles.video} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Video Path: <Link href={getFileStreamUrl(results.recordedVideoPath)} target="_blank" rel="noopener noreferrer">{results.recordedVideoPath}</Link>
          </Typography>
        </Box>
      )}

      {results.geminiAnalysis && renderGeminiAnalysis(results.geminiAnalysis)}
    </Paper>
  );
};

export default PlaywrightOutputDisplay;
