import React, { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getMuiTheme } from './theme'; // Import getMuiTheme instead of light/darkTheme directly
import { useStore } from '@nanostores/react';
import { themeStore } from './stores/themeStore'; // Corrected import name to themeStore
import Loading from './components/Loading';

function App() {
  const { theme: currentTheme } = useStore(themeStore); // Correctly access 'theme' property
  const theme = getMuiTheme(currentTheme); // Use getMuiTheme function to create theme

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Suspense fallback={<Loading />}>
        <RouterProvider router={router} />
      </Suspense>
    </ThemeProvider>
  );
}

export default App;
