import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
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
  const muiTheme = useMemo(() => getMuiTheme(currentThemeMode), [currentThemeMode]);
  return _jsxs(ThemeProvider, {
    theme: muiTheme,
    children: [
      _jsx(CssBaseline, {}),
      _jsx(Layout, {
        children: _jsxs(Routes, {
          children: [
            _jsx(Route, { path: '/', element: _jsx(TtsGeneratorPage, {}) }),
            _jsx(Route, { path: '/login', element: _jsx(LoginPage, {}) }),
            ' ',
            _jsx(Route, { path: '/auth/callback', element: _jsx(AuthCallback, {}, nanoid()) }),
          ],
        }),
      }),
    ],
  });
}
export default App;
