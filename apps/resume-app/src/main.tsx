import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { getTheme } from './theme';
import { useStore } from '@nanostores/react';
import { themeStore } from './stores/themeStore';

function Main() {
  const { mode } = useStore(themeStore);
  const theme = React.useMemo(() => getTheme(mode), [mode]);

  // Apply 'dark' class to the html element based on theme mode
  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  return (
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Main />);
