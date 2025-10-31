import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getMuiTheme } from './theme';
import { Layout } from './components/Layout';
import { TtsGeneratorPage } from './pages/TtsGeneratorPage';
import { AuthCallback } from './pages/AuthCallback';
import { PlannerPage } from './pages/PlannerPage';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage'; // New: Import HomePage
import { TtsLandingPage } from './pages/TtsLandingPage'; // New: Import TtsLandingPage
import { PlannerLandingPage } from './pages/PlannerLandingPage'; // New: Import PlannerLandingPage
import { themeAtom } from './stores/themeStore';
import { useStore } from '@nanostores/react';
import { useMemo } from 'react';
import { nanoid } from 'nanoid';
import { initAuth } from './stores/authStore';

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
          <Route path="/" element={<HomePage />} /> {/* New: Homepage as root */}
          <Route path="/tts" element={<TtsLandingPage />} /> {/* New: TTS Landing Page */}
          <Route path="/tts-generator" element={<TtsGeneratorPage />} /> {/* Modified: Actual TTS Generator */}
          <Route path="/planner" element={<PlannerLandingPage />} /> {/* New: Planner Landing Page */}
          <Route path="/planner-generator" element={<PlannerPage />} /> {/* Modified: Actual Planner Page */}
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/auth/callback"
            element={<AuthCallback key={nanoid()} />} // Use nanoid for unique key on callback
          />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
