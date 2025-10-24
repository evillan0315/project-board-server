import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  IconButton,
  Stack,
  InputLabel,
  FormControl,
  Divider,
  Tooltip,
  CircularProgress, // Added CircularProgress import
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LoginIcon from '@mui/icons-material/Login';
import ClickIcon from '@mui/icons-material/TouchApp';
import InputIcon from '@mui/icons-material/Input';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AccessTimeIcon from '@mui/icons-material/AccessTime'; // Import for WAIT action

import { useStore } from '@nanostores/react';
import { playwrightStore, updatePerformTasksForm, addNavigationStep, updateNavigationStep, removeNavigationStep } from './stores/playwrightStore';
import { PlaywrightNavigationAction, type IPerformMultipleTasksDto, type IScrapeUrlDto, type IScreenshotUrlDto, type IRecordScreenDto, type INavigationStepDto, type ILoginCredentialsDto } from './types/IPlaywrightTypes';

interface PlaywrightControlsProps {
  onScrape: (data: IScrapeUrlDto) => void;
  onScreenshot: (data: IScreenshotUrlDto) => void;
  onStartRecording: (data: IRecordScreenDto) => void;
  onStopRecording: () => void;
  onPerformTasks: (data: IPerformMultipleTasksDto) => void;
  isRecording: boolean;
  loading: boolean;
}

const controlStyles = {
  paper: {
    p: 3,
    mb: 3,
    backgroundColor: 'background.paper',
    borderRadius: 2,
    boxShadow: 3,
  },
  heading: {
    mb: 2,
    color: 'primary.main',
    borderBottom: '1px solid',
    borderColor: 'divider',
    pb: 1,
  },
  subHeading: {
    mt: 2,
    mb: 1,
    color: 'text.secondary',
  },
  buttonGroup: {
    mt: 2,
    display: 'flex',
    gap: 2,
    flexWrap: 'wrap',
  },
  textField: {
    mt: 1,
    mb: 1,
    width: '100%',
  },
  smallTextField: {
    mt: 1,
    mb: 1,
    width: 'auto',
  },
  formControl: {
    mt: 1,
    mb: 1,
    width: '100%',
  },
};

const PlaywrightControls: React.FC<PlaywrightControlsProps> = ({
  onScrape,
  onScreenshot,
  onStartRecording,
  onStopRecording,
  onPerformTasks,
  isRecording,
  loading,
}) => {
  const playwrightState = useStore(playwrightStore);
  const { currentUrl, navigationSteps, performTasksForm } = playwrightState;

  const [scrapeUrl, setScrapeUrl] = useState(currentUrl);
  const [scrapeSelector, setScrapeSelector] = useState('');
  const [returnHtml, setReturnHtml] = useState(false);
  const [scrapeGeminiPrompt, setScrapeGeminiPrompt] = useState('');
  const [scrapeTakeScreenshot, setScrapeTakeScreenshot] = useState(false);

  const [screenshotUrl, setScreenshotUrl] = useState(currentUrl);
  const [screenshotFullPage, setScreenshotFullPage] = useState(true);
  const [screenshotSelector, setScreenshotSelector] = useState('');
  const [screenshotGeminiPrompt, setScreenshotGeminiPrompt] = useState('');

  const [recordUrl, setRecordUrl] = useState(currentUrl);
  const [recordDuration, setRecordDuration] = useState<number | undefined>(undefined);
  const [recordOutputFileName, setRecordOutputFileName] = useState<string>('');

  // Sync local state with global store for PerformTasksForm on mount and store changes
  useEffect(() => {
    setScrapeUrl(currentUrl);
    setScreenshotUrl(currentUrl);
    setRecordUrl(currentUrl);
  }, [currentUrl]);

  useEffect(() => {
    setRecordOutputFileName(playwrightState.recordingFileName); // Sync default recording name
  }, [playwrightState.recordingFileName]);

  const handlePerformTasksFormChange = (field: keyof typeof performTasksForm, value: any) => {
    updatePerformTasksForm({ [field]: value });
  };

  const handleScrapeSubmit = () => {
    const data: IScrapeUrlDto = {
      url: scrapeUrl,
      selector: scrapeSelector || undefined,
      returnHtml: returnHtml,
      geminiPrompt: scrapeGeminiPrompt || undefined,
      takeScreenshot: scrapeTakeScreenshot,
    };
    onScrape(data);
  };

  const handleScreenshotSubmit = () => {
    const data: IScreenshotUrlDto = {
      url: screenshotUrl,
      fullPage: screenshotFullPage,
      selector: screenshotSelector || undefined,
      geminiPrompt: screenshotGeminiPrompt || undefined,
    };
    onScreenshot(data);
  };

  const handleStartRecordingSubmit = () => {
    const data: IRecordScreenDto = {
      url: recordUrl,
      duration: recordDuration || undefined,
      outputFileName: recordOutputFileName || undefined,
    };
    onStartRecording(data);
  };

  const handlePerformTasksSubmit = () => {
    const data: IPerformMultipleTasksDto = {
      url: currentUrl, // Always use the main currentUrl for multi-task orchestration
      llmInstruction: performTasksForm.llmInstruction || undefined,
      navigationSteps: navigationSteps.length > 0 ? navigationSteps : undefined,
      shouldScrape: performTasksForm.shouldScrape,
      scrapeSelector: performTasksForm.scrapeSelector || undefined,
      returnHtmlForScrape: performTasksForm.returnHtmlForScrape,
      shouldTakeScreenshot: performTasksForm.shouldTakeScreenshot,
      screenshotFullPage: performTasksForm.screenshotFullPage,
      screenshotSelector: performTasksForm.screenshotSelector || undefined,
      shouldRecordScreen: performTasksForm.shouldRecordScreen,
      recordDuration: performTasksForm.recordDuration || undefined,
      recordOutputFileName: performTasksForm.recordOutputFileName || undefined,
    };
    onPerformTasks(data);
  };

  const getActionIcon = (action: PlaywrightNavigationAction) => {
    switch (action) {
      case PlaywrightNavigationAction.NAVIGATE:
        return <NavigateNextIcon />;
      case PlaywrightNavigationAction.CLICK:
        return <ClickIcon />;
      case PlaywrightNavigationAction.TYPE:
        return <InputIcon />;
      case PlaywrightNavigationAction.LOGIN:
        return <LoginIcon />;
      case PlaywrightNavigationAction.WAIT:
        return <AccessTimeIcon />;
      default:
        return null;
    }
  };

  const addNewNavigationStep = () => {
    // Initialize with a default NAVIGATE step. The other fields (like loginCredentials)
    // will be dynamically initialized or cleared when the action type is changed by the user
    // using updateNavStepField.
    addNavigationStep({ action: PlaywrightNavigationAction.NAVIGATE, url: '' });
  };

  const updateNavStepField = (index: number, field: keyof INavigationStepDto | keyof ILoginCredentialsDto, value: any, isLoginField: boolean = false) => {
    const currentSteps = playwrightStore.get().navigationSteps;
    const updatedStep = { ...currentSteps[index] };

    if (isLoginField) {
      if (updatedStep.action === PlaywrightNavigationAction.LOGIN) {
        // Ensure loginCredentials object is initialized with default empty strings
        // before updating a specific field within it.
        updatedStep.loginCredentials = {
          username: '',
          password: '',
          usernameSelector: '',
          passwordSelector: '',
 submitSelector: '',
          ...(updatedStep.loginCredentials || {}), // Preserve existing values if present
          [field]: value,
        };
      } else {
        console.warn(`Attempted to update login field '${String(field)}' for a non-LOGIN action type.`);
      }
    } else {
      // Handle changing the action type itself
      if (field === 'action') {
        updatedStep.action = value as PlaywrightNavigationAction;
        // If action changes TO LOGIN, initialize loginCredentials if it doesn't exist
        if (value === PlaywrightNavigationAction.LOGIN && !updatedStep.loginCredentials) {
          updatedStep.loginCredentials = {
            username: '',
            password: '',
            usernameSelector: '',
passwordSelector: '',
submitSelector: '',
};
        } else if (value !== PlaywrightNavigationAction.LOGIN) {
          // If action changes FROM LOGIN, clear loginCredentials to clean up state
          delete updatedStep.loginCredentials;
        }
      } else {
        // For other fields directly on NavigationStepDto (url, selector, value, durationMs)
        (updatedStep as any)[field] = value;
      }
    }
    updateNavigationStep(index, updatedStep);
  };

  return (
    <Box className="space-y-6">
      {/* Global URL Input */}
      <Paper sx={controlStyles.paper} className="shadow-lg">
        <Typography variant="h5" sx={controlStyles.heading}>Target URL</Typography>
        <TextField
          label="Target URL"
          value={currentUrl}
          onChange={(e) => playwrightStore.set({ ...playwrightState, currentUrl: e.target.value })}
          placeholder="https://www.example.com"
          sx={controlStyles.textField}
          disabled={loading || isRecording}
        />
      </Paper>

      {/* Scrape URL Section */}
      <Paper sx={controlStyles.paper} className="shadow-lg">
        <Typography variant="h5" sx={controlStyles.heading}>1. Scrape URL</Typography>
        <TextField
          label="CSS Selector (optional)"
          value={scrapeSelector}
          onChange={(e) => setScrapeSelector(e.target.value)}
          placeholder="e.g., #main-content"
          sx={controlStyles.textField}
          disabled={loading || isRecording}
        />
        <FormControlLabel
          control={<Checkbox checked={returnHtml} onChange={(e) => setReturnHtml(e.target.checked)} disabled={loading || isRecording} />}
          label="Return Full HTML"
        />
        <FormControlLabel
          control={<Checkbox checked={scrapeTakeScreenshot} onChange={(e) => setScrapeTakeScreenshot(e.target.checked)} disabled={loading || isRecording} />}
          label="Take Screenshot with Scrape"
        />
        <TextField
          label="Gemini Prompt (optional)"
          value={scrapeGeminiPrompt}
          onChange={(e) => setScrapeGeminiPrompt(e.target.value)}
          placeholder="Summarize the content..."
          sx={controlStyles.textField}
          disabled={loading || isRecording}
        />
        <Button
          variant="contained"
          onClick={handleScrapeSubmit}
          disabled={loading || isRecording || !currentUrl}
          sx={controlStyles.buttonGroup}
        >
          Scrape
          {loading && <CircularProgress size={20} color="inherit" sx={{ ml: 1 }} />}
        </Button>
      </Paper>

      {/* Screenshot URL Section */}
      <Paper sx={controlStyles.paper} className="shadow-lg">
        <Typography variant="h5" sx={controlStyles.heading}>2. Take Screenshot</Typography>
        <TextField
          label="CSS Selector (optional, overrides full page)"
          value={screenshotSelector}
          onChange={(e) => setScreenshotSelector(e.target.value)}
          placeholder="e.g., .header-banner"
          sx={controlStyles.textField}
          disabled={loading || isRecording}
        />
        <FormControlLabel
          control={<Checkbox checked={screenshotFullPage} onChange={(e) => setScreenshotFullPage(e.target.checked)} disabled={loading || isRecording} />}
          label="Full Page Screenshot"
        />
        <TextField
          label="Gemini Prompt (optional)"
          value={screenshotGeminiPrompt}
          onChange={(e) => setScreenshotGeminiPrompt(e.target.value)}
          placeholder="Describe what you see..."
          sx={controlStyles.textField}
          disabled={loading || isRecording}
        />
        <Button
          variant="contained"
          onClick={handleScreenshotSubmit}
          disabled={loading || isRecording || !currentUrl}
          sx={controlStyles.buttonGroup}
        >
          Screenshot
          {loading && <CircularProgress size={20} color="inherit" sx={{ ml: 1 }} />}
        </Button>
      </Paper>

      {/* Screen Recording Section */}
      <Paper sx={controlStyles.paper} className="shadow-lg">
        <Typography variant="h5" sx={controlStyles.heading}>3. Screen Recording</Typography>
        <TextField
          label="Duration (seconds, optional)"
          type="number"
          value={recordDuration === undefined ? '' : recordDuration}
          onChange={(e) => setRecordDuration(e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="e.g., 60"
          sx={controlStyles.textField}
          disabled={loading || isRecording}
          inputProps={{ min: 1 }}
        />
        <TextField
          label="Output File Name (optional, e.g., my-recording.webm)"
          value={recordOutputFileName}
          onChange={(e) => setRecordOutputFileName(e.target.value)}
          placeholder="e.g., my-session.webm"
          sx={controlStyles.textField}
          disabled={loading || isRecording}
        />
        <Box sx={controlStyles.buttonGroup}>
          <Button
            variant="contained"
            color="success"
            onClick={handleStartRecordingSubmit}
            disabled={loading || isRecording || !currentUrl}
          >
            Start Recording
            {loading && <CircularProgress size={20} color="inherit" sx={{ ml: 1 }} />}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={onStopRecording}
            disabled={loading || !isRecording}
          >
            Stop Recording
            {loading && <CircularProgress size={20} color="inherit" sx={{ ml: 1 }} />}
          </Button>
        </Box>
      </Paper>

      {/* Perform Multiple Tasks Section */}
      <Paper sx={controlStyles.paper} className="shadow-lg">
        <Typography variant="h5" sx={controlStyles.heading}>4. Orchestrate Multiple Tasks</Typography>

        <TextField
          label="LLM Instruction / Playwright Command (optional)"
          value={performTasksForm.llmInstruction}
          onChange={(e) => handlePerformTasksFormChange('llmInstruction', e.target.value)}
          placeholder="e.g., Enter Email address:x@y.com in (input#email) and Password:pw in (input#password) field and click the Sign in (#login-submit-btn) button, then summarize the page."
          sx={controlStyles.textField}
          multiline
          rows={3}
          disabled={loading || isRecording}
          helperText="This text can be interpreted as Playwright navigation commands (e.g., for login) which will be prepended to explicit 'Navigation Steps', OR as a high-level prompt for the final Gemini AI analysis of results."
        />

        <Typography variant="h6" sx={controlStyles.subHeading}>Navigation Steps</Typography>
        <Stack spacing={2} sx={{ mb: 2 }}>
          {navigationSteps.map((step, index) => (
            <Box key={index} sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Action</InputLabel>
                  <Select
                    value={step.action}
                    onChange={(e) => updateNavStepField(index, 'action', e.target.value as PlaywrightNavigationAction)}
                    label="Action"
                    disabled={loading || isRecording}
                  >
                    {Object.values(PlaywrightNavigationAction).map((action) => (
                      <MenuItem key={action} value={action}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {getActionIcon(action)}
                          <Typography>{action}</Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Tooltip title="Remove Step">
                  <IconButton onClick={() => removeNavigationStep(index)} color="error" disabled={loading || isRecording}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Stack>

              {step.action === PlaywrightNavigationAction.NAVIGATE && (
                <TextField
                  label="URL"
                  value={step.url || ''}
                  onChange={(e) => updateNavStepField(index, 'url', e.target.value)}
                  sx={controlStyles.textField}
                  placeholder="https://www.new-page.com"
                  disabled={loading || isRecording}
                />
              )}

              {(step.action === PlaywrightNavigationAction.CLICK || step.action === PlaywrightNavigationAction.TYPE) && (
                <TextField
                  label="CSS Selector"
                  value={step.selector || ''}
                  onChange={(e) => updateNavStepField(index, 'selector', e.target.value)}
                  sx={controlStyles.textField}
                  placeholder="e.g., #submitButton"
                  disabled={loading || isRecording}
                />
              )}

              {step.action === PlaywrightNavigationAction.TYPE && (
                <TextField
                  label="Value to Type"
                  value={step.value || ''}
                  onChange={(e) => updateNavStepField(index, 'value', e.target.value)}
                  sx={controlStyles.textField}
                  placeholder="e.g., my text input"
                  disabled={loading || isRecording}
                />
              )}

              {step.action === PlaywrightNavigationAction.LOGIN && (
                <Box sx={{ mt: 1, p: 1, border: '1px dashed grey', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Login Details:</Typography>
                  <TextField
                    label="Username/Email"
                    value={step.loginCredentials?.username || ''}
                    onChange={(e) => updateNavStepField(index, 'username', e.target.value, true)}
                    sx={controlStyles.textField}
                    placeholder="user@example.com"
                    disabled={loading || isRecording}
                  />
                  <TextField
                    label="Password"
                    type="password"
                    value={step.loginCredentials?.password || ''}
                    onChange={(e) => updateNavStepField(index, 'password', e.target.value, true)}
                    sx={controlStyles.textField}
                    placeholder="••••••••"
                    disabled={loading || isRecording}
                  />
                  <TextField
                    label="Username/Email Selector"
                    value={step.loginCredentials?.usernameSelector || ''}
                    onChange={(e) => updateNavStepField(index, 'usernameSelector', e.target.value, true)}
                    sx={controlStyles.textField}
                    placeholder="#emailInput"
                    disabled={loading || isRecording}
                  />
                  <TextField
                    label="Password Selector"
                    value={step.loginCredentials?.passwordSelector || ''}
                    onChange={(e) => updateNavStepField(index, 'passwordSelector', e.target.value, true)}
                    sx={controlStyles.textField}
                    placeholder="#passwordInput"
                    disabled={loading || isRecording}
                  />
                  <TextField
                    label="Submit Button Selector"
                    value={step.loginCredentials?.submitSelector || ''}
                    onChange={(e) => updateNavStepField(index, 'submitSelector', e.target.value, true)}
                    sx={controlStyles.textField}
                    placeholder="#loginButton"
                    disabled={loading || isRecording}
                  />
                </Box>
              )}

              {step.action === PlaywrightNavigationAction.WAIT && (
                <Box sx={{ mt: 1, p: 1, border: '1px dashed grey', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Wait Condition:</Typography>
                  <TextField
                    label="Duration (ms, optional)"
                    type="number"
                    value={step.durationMs === undefined ? '' : step.durationMs}
                    onChange={(e) => updateNavStepField(index, 'durationMs', e.target.value ? parseInt(e.target.value) : undefined)}
                    sx={controlStyles.textField}
                    placeholder="e.g., 5000"
                    disabled={loading || isRecording}
                    inputProps={{ min: 0 }}
                  />
                  <Typography variant="body2" sx={{ my: 1, textAlign: 'center' }}>OR</Typography>
                  <TextField
                    label="CSS Selector (optional)"
                    value={step.selector || ''}
                    onChange={(e) => updateNavStepField(index, 'selector', e.target.value)}
                    sx={controlStyles.textField}
                    placeholder="e.g., #dataLoadedElement"
                    disabled={loading || isRecording}
                    helperText="Wait for this element to appear in the DOM."
                  />
                </Box>
              )}
            </Box>
          ))}
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addNewNavigationStep}
            disabled={loading || isRecording}
          >
            Add Navigation Step
          </Button>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={controlStyles.subHeading}>Result Collection Options</Typography>
        <Stack direction="column" spacing={1}>
          <FormControlLabel
            control={<Checkbox checked={performTasksForm.shouldScrape} onChange={(e) => handlePerformTasksFormChange('shouldScrape', e.target.checked)} disabled={loading || isRecording} />}
            label="Scrape Content"
          />
          {performTasksForm.shouldScrape && (
            <Box sx={{ pl: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                label="Scrape Selector (optional)"
                value={performTasksForm.scrapeSelector}
                onChange={(e) => handlePerformTasksFormChange('scrapeSelector', e.target.value)}
                sx={controlStyles.textField}
                size="small"
                disabled={loading || isRecording}
              />
              <FormControlLabel
                control={<Checkbox checked={performTasksForm.returnHtmlForScrape} onChange={(e) => handlePerformTasksFormChange('returnHtmlForScrape', e.target.checked)} disabled={loading || isRecording} />}
                label="Return HTML for Scrape"
              />
            </Box>
          )}

          <FormControlLabel
            control={<Checkbox checked={performTasksForm.shouldTakeScreenshot} onChange={(e) => handlePerformTasksFormChange('shouldTakeScreenshot', e.target.checked)} disabled={loading || isRecording} />}
            label="Take Screenshot"
          />
          {performTasksForm.shouldTakeScreenshot && (
            <Box sx={{ pl: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={<Checkbox checked={performTasksForm.screenshotFullPage} onChange={(e) => handlePerformTasksFormChange('screenshotFullPage', e.target.checked)} disabled={loading || isRecording} />}
                label="Full Page Screenshot"
              />
              <TextField
                label="Screenshot Selector (optional)"
                value={performTasksForm.screenshotSelector}
                onChange={(e) => handlePerformTasksFormChange('screenshotSelector', e.target.value)}
                sx={controlStyles.textField}
                size="small"
                disabled={loading || isRecording}
              />
            </Box>
          )}

          <FormControlLabel
            control={<Checkbox checked={performTasksForm.shouldRecordScreen} onChange={(e) => handlePerformTasksFormChange('shouldRecordScreen', e.target.checked)} disabled={loading || isRecording} />}
            label="Record Screen"
          />
          {performTasksForm.shouldRecordScreen && (
            <Box sx={{ pl: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                label="Record Duration (seconds, optional)"
                type="number"
                value={performTasksForm.recordDuration === undefined ? '' : performTasksForm.recordDuration}
                onChange={(e) => handlePerformTasksFormChange('recordDuration', e.target.value ? parseInt(e.target.value) : undefined)}
                sx={controlStyles.textField}
                size="small"
                disabled={loading || isRecording}
                inputProps={{ min: 1 }}
              />
              <TextField
                label="Record Output File Name (optional)"
                value={performTasksForm.recordOutputFileName}
                onChange={(e) => handlePerformTasksFormChange('recordOutputFileName', e.target.value)}
                sx={controlStyles.textField}
                size="small"
                disabled={loading || isRecording}
              />
            </Box>
          )}
        </Stack>

        <Button
          variant="contained"
          color="primary"
          onClick={handlePerformTasksSubmit}
          disabled={loading || isRecording || !currentUrl}
          sx={controlStyles.buttonGroup}
        >
          Perform Tasks
          {loading && <CircularProgress size={20} color="inherit" sx={{ ml: 1 }} />}
        </Button>
      </Paper>
    </Box>
  );
};

export default PlaywrightControls;
