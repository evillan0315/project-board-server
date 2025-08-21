import React, { useState } from 'react';
import TextField from '@/components/ui/TextField';
import Button from '@/components/ui/Button';
import CircularProgress from '@/components/ui/CircularProgress';
import { validateJson, repairJson } from '@/services/jsonFixService';
import { JsonOutputDto } from '@/types/json-fix';

import { Box, Typography, Paper, Alert, Grid } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const JsonFixerPage: React.FC = () => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [schemaInput, setSchemaInput] = useState<string>('');
  const [result, setResult] = useState<JsonOutputDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const schema = schemaInput ? JSON.parse(schemaInput) : undefined;
      const validationResult = await validateJson(jsonInput, schema);
      setResult(validationResult);
    } catch (e) {
      if (e instanceof SyntaxError) {
        setError(`Invalid JSON Schema: ${e.message}`);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unexpected error occurred during validation.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRepair = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const repairResult = await repairJson(jsonInput);
      setResult(repairResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred during repair.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string | undefined) => {
    if (text) {
      navigator.clipboard.writeText(text).then(
        () => {
          alert('Copied to clipboard!');
        },
        (err) => {
          console.error('Failed to copy: ', err);
          alert('Failed to copy to clipboard.');
        },
      );
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 3, sm: 4 },
        mt: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="h5" color="text.primary" sx={{ mb: 4, fontWeight: 'bold' }}>
        JSON Validator and Repair Tool
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            label="JSON Input"
            multiline
            rows={10}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Enter your JSON here..."
            helperText="Required for both validation and repair."
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="JSON Schema (Optional)"
            multiline
            rows={10}
            value={schemaInput}
            onChange={(e) => setSchemaInput(e.target.value)}
            placeholder="Enter your JSON Schema here for validation..."
            helperText="Provide a schema to validate your JSON against it."
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleValidate}
          disabled={loading || !jsonInput}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Validate JSON'}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleRepair}
          disabled={loading || !jsonInput}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Repair JSON'}
        </Button>
      </Box>

      {loading && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }} color="text.secondary">
            Processing...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" color="text.primary" sx={{ mb: 2, fontWeight: 'bold' }}>
            Result:
          </Typography>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              bgcolor: result.valid ? 'success.light' : 'error.light',
              overflowX: 'auto',
              border: '1px solid',
              borderColor: result.valid ? 'success.main' : 'error.main',
            }}
            className="flex flex-col gap-2"
          >
            <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
              Status: {result.valid ? 'Valid' : 'Invalid'}
            </Typography>
            {result.errors && result.errors.length > 0 && (
              <Box>
                <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                  Errors:
                </Typography>
                <ul className="list-disc list-inside ml-4">
                  {result.errors.map((err, index) => (
                    <li key={index} className="text-sm" style={{ color: 'inherit' }}>
                      {typeof err === 'string' ? err : JSON.stringify(err)}
                    </li>
                  ))}
                </ul>
              </Box>
            )}
            {result.repairedJson && (
              <Box sx={{ position: 'relative' }}>
                <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                  Repaired JSON:
                </Typography>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    backgroundColor: 'background.default',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    position: 'relative',
                    paddingRight: '40px', // Space for copy button
                    color: 'text.primary',
                  }}
                >
                  {result.repairedJson}
                </pre>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => copyToClipboard(result.repairedJson)}
                  sx={{
                    position: 'absolute',
                    top: { xs: 40, sm: 8 }, // Adjust position for button
                    right: 8,
                    minWidth: 'auto',
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' },
                  }}
                  title="Copy Repaired JSON"
                >
                  <ContentCopyIcon fontSize="small" />
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </Paper>
  );
};

export default JsonFixerPage;
