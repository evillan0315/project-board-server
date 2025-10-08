// src/main.tsx  (or index.tsx)
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { useStore } from '@nanostores/react';
import { themeStore } from './stores/themeStore';
import { getAppTheme } from './theme';

const rootElement = document.getElementById('root')!;

const Root = () => {
  const { mode } = useStore(themeStore);

  useEffect(() => {
    if (mode === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [mode]);

  const theme = React.useMemo(() => getAppTheme(mode), [mode]);

  return (
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(rootElement).render(<Root />);
