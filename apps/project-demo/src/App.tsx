import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { customTheme } from './theme';
import { Layout } from './components/Layout';
import { TtsGeneratorPage } from './pages/TtsGeneratorPage';
import { AuthCallback } from './pages/AuthCallback';
import { useThemeStore } from './stores/themeStore';
import { nanoid } from 'nanoid';

function App() {
  // Trigger theme store initialization to load from localStorage
  useThemeStore.get().theme;

  return (
    <ThemeProvider theme={customTheme}>
      <CssBaseline />
      <Layout>
        <Routes>
          <Route path="/" element={<TtsGeneratorPage />} />
          <Route
            path="/auth/callback"
            element={<AuthCallback key={nanoid()} />} // Use nanoid for unique key on callback
          />
          {/* Add other routes here if needed */}
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
