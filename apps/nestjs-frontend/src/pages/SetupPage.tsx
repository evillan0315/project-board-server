import React from 'react';
import { Box, Typography, TextField, Button, Paper, Container } from '@mui/material';

export function SetupPage() {
  const [appName, setAppName] = React.useState('');
  const [apiEndpoint, setApiEndpoint] = React.useState('http://localhost:3000');

  const handleSave = () => {
    // In a real application, this would send data to a backend API
    // For now, just log the values
    console.log('Saving setup configuration:', {
      appName,
      apiEndpoint,
    });
    alert('Configuration saved (check console)!');
    // Example: Call a NestJS backend setup endpoint
    // fetch('/api/setup', { method: 'POST', body: JSON.stringify({ appName, apiEndpoint }), headers: { 'Content-Type': 'application/json' } })
    //   .then(res => res.json())
    //   .then(data => console.log(data))
    //   .catch(error => console.error('Error saving config:', error));
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
      <Paper
        elevation={6}
        sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          Application Setup
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 3 }}>
          Welcome! Please configure your application settings to get started.
        </Typography>
        <Box component="form" noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="appName"
            label="Application Name"
            name="appName"
            autoFocus
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            helperText="e.g., My Awesome App"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="apiEndpoint"
            label="Backend API Endpoint"
            name="apiEndpoint"
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
            helperText="e.g., http://localhost:3000/api"
          />
          {/* Add more configuration fields as needed */}
          <Button
            type="button"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={handleSave}
          >
            Save Configuration
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
