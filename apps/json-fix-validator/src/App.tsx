import React from 'react';
import ReactDOM from 'react-dom/client';

import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { getTheme } from './themes';
import { useStore } from '@nanostores/react';
import { themeStore } from './stores/themeStore';

import AppRoutes from './routes';

function App() {
  const { mode } = useStore(themeStore);
  const theme = React.useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRoutes />
    </ThemeProvider>
  );
}

export default App;
