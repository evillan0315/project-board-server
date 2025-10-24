import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useStore } from '@nanostores/react';
import { playwrightStore, setLoading, setError, setResults, startRecording, stopRecording, resetPlaywrightStore } from './stores/playwrightStore';
import { llmPlaywrightService } from './api/llmPlaywrightService';
import PlaywrightControls from './PlaywrightControls';
import PlaywrightOutputDisplay from './PlaywrightOutputDisplay';

import { type IScrapeUrlDto, type IScreenshotUrlDto, type IRecordScreenDto, type IPerformMultipleTasksDto } from './types/IPlaywrightTypes';

const playwrightPageStyles = {
  container: {
    p: 4,
    maxWidth: '1200px',
    mx: 'auto',
  },
  header: {
    mb: 4,
    textAlign: 'center',
    color: 'primary.dark',
  },
};

const PlaywrightPage: React.FC = () => {
  const { loading, error, results, activeRecording } = useStore(playwrightStore);

  useEffect(() => {
    // Clean up store state when component unmounts
    return () => {
      resetPlaywrightStore();
    };
  }, []);

  // Handlers for Playwright Controls
  const handleScrape = async (data: IScrapeUrlDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await llmPlaywrightService.scrapeUrl(data);
      setResults(res);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshot = async (data: IScreenshotUrlDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await llmPlaywrightService.takeScreenshot(data);
      setResults(res);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRecording = async (data: IRecordScreenDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await llmPlaywrightService.startRecording(data);
      startRecording(data.outputFileName || `recorded-${Date.now()}.webm`, data.duration);
      setResults(res);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStopRecording = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await llmPlaywrightService.stopRecording();
      stopRecording(); // Resets activeRecording state
      setResults(res);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
      // Ensure recording state is reset on error if it was active
      if (activeRecording) stopRecording();
    } finally {
      setLoading(false);
    }
  };

  const handlePerformTasks = async (data: IPerformMultipleTasksDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await llmPlaywrightService.performMultipleTasks(data);
      // The backend handles starting and stopping recording for multi-tasks. No need for frontend store updates here.
      setResults(res);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
      // If an error occurred during a multi-task that started a recording, the backend should have cleaned up.
      // No frontend activeRecording state to clear here for multi-tasks.
    } finally {
      setLoading(false);
    }
  };

  return (
      <Box sx={playwrightPageStyles.container} className="w-full">
        <Typography variant="h4" component="h1" sx={playwrightPageStyles.header}>LLM Playwright Automation</Typography>

        <PlaywrightControls
          onScrape={handleScrape}
          onScreenshot={handleScreenshot}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onPerformTasks={handlePerformTasks}
          isRecording={activeRecording}
          loading={loading}
        />

        <PlaywrightOutputDisplay
          results={results}
          loading={loading}
          error={error}
        />
      </Box>
  );
};

export default PlaywrightPage;
