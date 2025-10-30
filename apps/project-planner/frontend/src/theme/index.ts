import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { get } from '@nanostores/react';
import { themeStore } from '@/stores/snackbarStore'; // Using snackbarStore for now, will replace with proper themeStore

const rawTheme = createTheme({
  palette: {
    mode: get(themeStore).mode, // Use dark or light mode from the store
    primary: {
      main: '#90caf9',
      light: '#e3f2fd',
      dark: '#42a5f5',
      contrastText: '#000000',
    },
    secondary: {
      main: '#ce93d8',
      light: '#f3e5f5',
      dark: '#ab47bc',
      contrastText: '#000000',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
      contrastText: '#ffffff',
    },
    background: {
      default: get(themeStore).mode === 'dark' ? '#121212' : '#ffffff',
      paper: get(themeStore).mode === 'dark' ? '#1d1d1d' : '#f5f5f5',
    },
    text: {
      primary: get(themeStore).mode === 'dark' ? '#ffffff' : '#000000',
      secondary: get(themeStore).mode === 'dark' ? '#b0b0b0' : '#5f6368',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h1: { fontSize: '2.5rem' },
    h2: { fontSize: '2rem' },
    h3: { fontSize: '1.75rem' },
    h4: { fontSize: '1.5rem' },
    h5: { fontSize: '1.25rem' },
    h6: { fontSize: '1rem' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: get(themeStore).mode === 'dark' ? '#1e1e1e' : '#2196f3',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: get(themeStore).mode === 'dark' ? '#1e1e1e' : '#ffffff',
        },
      },
    },
  },
});

export const theme = responsiveFontSizes(rawTheme);
