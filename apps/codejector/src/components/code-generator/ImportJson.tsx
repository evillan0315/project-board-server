import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  Autocomplete,
  TextField,
} from '@mui/material';
import {
  getPaginatedGeminiRequests,
  getPaginatedGeminiResponses,
} from '@/api/gemini';
import {
  extractCodeFromMarkdown
} from '@/api/llm';
import { GeminiRequest, GeminiResponse } from '@/types/gemini';
import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';
import { loadingStore } from '@/stores/loadingStore';
import { showGlobalSnackbar } from '@/stores/snackbarStore';
import { useStore } from '@nanostores/react';

export interface ImportJsonProps {
  value: string;
  onChange: (value: string) => void;
}

// Styles for Material-UI components
const formControlSx = {
  minWidth: 200,
  width: '100%',
};

const selectContainerSx = {
  display: 'flex',
  flexDirection: { xs: 'column', sm: 'row' },
  gap: 2,
  px: 2,
  mb: 2,
};

/**
 * Truncates a string to a specified maximum length, appending '...' if truncated.
 */
const truncate = (text: string | null | undefined, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Determines the best title to display for a Gemini response.
 * It prioritizes response.title, then tries to extract a 'title' from JSON responseText,
 * and finally falls back to responseText.
 */
const getDisplayTitleForResponse = (response: GeminiResponse): string => {
  // Prefer the explicit title field if available
  if (response.title) {
    return response.title;
  }

  // If no explicit title, try to parse from responseText as JSON
  if (response.responseText) {
    try {
      const parsed = JSON.parse(extractCodeFromMarkdown(response.responseText));
      
      // Check if it's an object and has a 'title' property that is a string
      if (typeof parsed === 'object' && parsed !== null && 'title' in parsed && typeof parsed.title === 'string') {
        return parsed.title;
      }
    } catch (e) {
      // JSON parsing failed, or it's not an object with a title. Fall through.
    }
    // If not JSON or doesn't have a title, use the raw responseText
    return truncate(response.responseText, 50); // Truncate raw response text for display
  }

  return ''; // No title or responseText available
};

export const ImportJson: React.FC<ImportJsonProps> = ({
  value,
  onChange,
}) => {
  const [geminiRequests, setGeminiRequests] = useState<GeminiRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );
  const [geminiResponses, setGeminiResponses] = useState<GeminiResponse[]>([]
  );
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(
    null,
  );
  // Removed unused state: selectedResponseText
  // const [selectedResponseText, setSelectedResponseText] = useState<string | null>(null);
  const isLoading = useStore(loadingStore);

  // Helper function to process a selected GeminiResponse and update the editor
  const processAndSetResponseContent = useCallback((response: GeminiResponse | null) => {
    if (response && response.responseText) {
      try {
        const extractedCode = extractCodeFromMarkdown(response.responseText);
        const parsedJson = JSON.parse(extractedCode);
        onChange(JSON.stringify(parsedJson, null, 2));
        showGlobalSnackbar('JSON response loaded successfully.', 'success');
      } catch (e) {
        onChange(response.responseText);
        showGlobalSnackbar('Selected response is not valid JSON. Displaying raw content.', 'warning');
      }
    } else {
      onChange('');
    }
  }, [onChange]);


  // Fetch Gemini Requests of type 'LLM_GENERATION' on component mount
  useEffect(() => {
    const fetchRequests = async () => {
      //loadingStore.setLoading(true);
      try {
        const result = await getPaginatedGeminiRequests({
          requestType: 'LLM_GENERATION',
          limit: 100, // Fetch a reasonable number of recent requests
        });
        setGeminiRequests(result.items);
      } catch (error) {
        console.error('Failed to fetch Gemini requests:', error);
        showGlobalSnackbar('Failed to load Gemini requests.', 'error');
      } finally {
        //loadingStore.setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  // Fetch Gemini Responses when a request is selected and auto-select the first array response
  useEffect(() => {
    if (selectedRequestId) {
      const fetchResponses = async () => {
        //loadingStore.setLoading(true); // Re-enable if needed
        try {
          const result = await getPaginatedGeminiResponses({
            requestId: selectedRequestId,
            limit: 100,
          });
          
          setGeminiResponses(result.items);

          // Auto-select the first response that contains a top-level JSON array
          let foundArrayResponse: GeminiResponse | null = null;
          for (const response of result.items) {
            if (response.responseText) {
              try {
                const extractedCode = extractCodeFromMarkdown(response.responseText);
                const parsed = JSON.parse(extractedCode);
                if (Array.isArray(parsed)) { // Check if the root JSON is an array
                  foundArrayResponse = response;
                  break;
                }
              } catch (e) {
                // Not valid JSON or not an array at the root, continue to next response
              }
            }
          }
          console.log(foundArrayResponse, 'foundArrayResponse');
          if (foundArrayResponse) {
            setSelectedResponseId(foundArrayResponse.id);
            processAndSetResponseContent(foundArrayResponse);
          } else {
            setSelectedResponseId(null);
            onChange(''); // Clear content if no suitable response found
          }

        } catch (error) {
          console.error('Failed to fetch Gemini responses:', error);
          showGlobalSnackbar('Failed to load Gemini responses.', 'error');
          setSelectedResponseId(null);
          onChange('');
        } finally {
          //loadingStore.setLoading(false); // Re-enable if needed
        }
      };
      fetchResponses();
    } else {
      setGeminiResponses([]);
      setSelectedResponseId(null);
      onChange('');
    }
  }, [selectedRequestId, onChange, processAndSetResponseContent]); // Added processAndSetResponseContent to dependencies

  const handleRequestChange = useCallback(
    (event: React.SyntheticEvent, value: GeminiRequest | null) => {
      const newRequestId = value ? value.id : null;
      setSelectedRequestId(newRequestId);
      // Responses for the new request will be fetched and auto-selected by the useEffect hook
      // No need to clear selectedResponseId or onChange here explicitly,
      // as the useEffect for responses handles it.
    },
    [], // No dependencies needed as it only sets state
  );

  const handleResponseChange = useCallback(
    (event: any) => {
      const newResponseId = event.target.value as string;
      setSelectedResponseId(newResponseId);
      const selected = geminiResponses.find((r) => r.id === newResponseId);
      processAndSetResponseContent(selected || null); // Use the helper
    },
    [geminiResponses, processAndSetResponseContent],
  );

  return (
    <Box className="flex flex-col h-full py-4">
      <Box sx={selectContainerSx}>
        <Autocomplete
          fullWidth
          sx={formControlSx}
          options={geminiRequests}
          getOptionLabel={(option) => truncate(option.prompt, 50)}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          value={geminiRequests.find(req => req.id === selectedRequestId) || null}
          key={(option, value) => option.id === value.id}
          onChange={handleRequestChange}
          disabled={isLoading.isLoading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Gemini Request"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isLoading.isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <FormControl fullWidth sx={formControlSx}>
          <InputLabel id="gemini-response-select-label">Gemini Response</InputLabel>
          <Select
            labelId="gemini-response-select-label"
            id="gemini-response-select"
            value={selectedResponseId || ''}
            label="Gemini Response"
            onChange={handleResponseChange}
            disabled={isLoading.isLoading || !selectedRequestId}
          >
            <MenuItem value="">-- Select a Response --</MenuItem>
            {geminiResponses.map((response) => (
              <MenuItem key={response.id} value={response.id}>
                 <Typography noWrap>
                   {getDisplayTitleForResponse(response)} ({new Date(response.createdAt).toLocaleString()})
                 </Typography>
              </MenuItem>
            ))}
          </Select>
          {isLoading.isLoading && (
            <CircularProgress size={20} className="absolute right-4 top-1/2 -translate-y-1/2" />
          )}
        </FormControl>
      </Box>

      <Box className="flex-grow min-h-0">
        <CodeMirrorEditor
          value={value}
          onChange={onChange}
          filePath={`temp.json`}
          height="100%"
        />
      </Box>
    </Box>
  );
};