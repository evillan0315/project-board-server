import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { themeStore } from '@/stores/themeStore';
import { jsonYamlService } from '@/services/jsonYamlService';
import { Box, Typography, Grid, Paper, Alert } from '@mui/material';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { CircularProgress } from '@/components/ui/CircularProgress';

const JsonToYamlPage: React.FC = () => {
  const { isDarkMode } = useStore(themeStore);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [yamlInput, setYamlInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleJsonToYaml = async () => {
    setError(null);
    setLoading(true);
    try {
      const parsedJson = JSON.parse(jsonInput);
      const response = await jsonYamlService.convertJsonToYaml(parsedJson);
      setYamlInput(response.yaml);
    } catch (err: any) {
      setError(err.message || 'Failed to convert JSON to YAML');
    } finally {
      setLoading(false);
    }
  };

  const handleYamlToJson = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await jsonYamlService.convertYamlToJson(yamlInput);
      setJsonInput(JSON.stringify(response.json, null, 2));
    } catch (err: any) {
      setError(err.message || 'Failed to convert YAML to JSON');
    } finally {
      setLoading(false);
    }
  };

  // Example pre-fill for user convenience
  React.useEffect(() => {
    setJsonInput(`{
  "name": "John Doe",
  "age": 30,
  "isStudent": false,
  "address": {
    "street": "123 Main St",
    "city": "Anytown"
  },
  "hobbies": [
    "reading",
    "hiking",
    "coding"
  ]
}`);
    setYamlInput(
      `name: Jane Doe\nage: 25\nisStudent: true\naddress:\n  street: 456 Oak Ave\n  city: Smallville\nhobbies:\n  - painting\n  - gaming\n  - gardening`,
    );
  }, []);

  return (
    <Box
      sx={{
        p: 4,
        minHeight: 'calc(100vh - 64px)', // Adjust based on Navbar height
        backgroundColor: isDarkMode ? 'background.default' : 'background.paper', // MUI theme background
      }}
      className="dark:bg-gray-900 transition-colors duration-200"
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          backgroundColor: isDarkMode ? 'background.paper' : 'white', // More specific MUI paper background
          color: isDarkMode ? 'white' : 'text.primary',
        }}
        className="dark:bg-gray-800 dark:text-gray-50"
      >
        <Typography variant="h4" component="h1" gutterBottom className="mb-6">
          JSON &lt;-&gt; YAML Converter
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* JSON Input/Output */}
          <Grid item xs={12} md={6}>
            <TextField
              label="JSON"
              multiline
              rows={15}
              fullWidth
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
              className="dark:bg-gray-700 dark:text-gray-50"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleJsonToYaml}
              disabled={loading}
              fullWidth
              className="dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {loading ? (
                <CircularProgress size={24} className="text-white" />
              ) : (
                'Convert JSON to YAML'
              )}
            </Button>
          </Grid>

          {/* YAML Input/Output */}
          <Grid item xs={12} md={6}>
            <TextField
              label="YAML"
              multiline
              rows={15}
              fullWidth
              value={yamlInput}
              onChange={(e) => setYamlInput(e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
              className="dark:bg-gray-700 dark:text-gray-50"
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={handleYamlToJson}
              disabled={loading}
              fullWidth
              className="dark:bg-purple-600 dark:hover:bg-purple-700"
            >
              {loading ? (
                <CircularProgress size={24} className="text-white" />
              ) : (
                'Convert YAML to JSON'
              )}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default JsonToYamlPage;
