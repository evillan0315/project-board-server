import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { theme } from './theme';
import { AppRoutes } from './routes';
import { Layout } from './components/Layout';
import { Snackbar } from './components/Snackbar';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        <AppRoutes />
      </Layout>
      <Snackbar />
    </ThemeProvider>
  );
}

export default App;
