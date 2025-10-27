import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getMuiTheme } from './theme';
import { Layout } from './components/Layout';
import { TtsGeneratorPage } from './pages/TtsGeneratorPage';
import { AuthCallback } from './pages/AuthCallback';
import { LoginPage } from './pages/LoginPage'; // Import LoginPage
import { themeAtom } from './stores/themeStore';
import { useStore } from '@nanostores/react';
import { useMemo } from 'react';
import { nanoid } from 'nanoid';
import { initAuth } from './stores/authStore'; // Import initAuth

// Initialize authentication store on app start
initAuth();

function App() {
  const { theme: currentThemeMode } = useStore(themeAtom);

  // Ensure currentThemeMode is never undefined for getMuiTheme
  // Provide 'light' as a fallback if currentThemeMode is momentarily undefined.
  const muiTheme = useMemo(() => getMuiTheme(currentThemeMode || 'light'), [currentThemeMode]);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Layout>
        <Routes>
          <Route path="/" element={<TtsGeneratorPage />} />
          <Route path="/login" element={<LoginPage />} /> { /* Add login route */ }
          <Route
            path="/auth/callback"
            element={<AuthCallback key={nanoid()} />} // Use nanoid for unique key on callback
          />
          { /* Add other routes here if needed */ }
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
