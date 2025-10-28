import { createTheme } from '@mui/material/styles';
import type { TextFieldProps } from '@mui/material/TextField';

// Common configurations regardless of theme mode
const commonSettings = {
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700 },
    h2: { fontSize: '2rem', fontWeight: 600 },
    h3: { fontSize: '1.75rem', fontWeight: 600 },
    h4: { fontSize: '1.5rem', fontWeight: 500 },
    h5: { fontSize: '1.25rem', fontWeight: 500 },
    h6: { fontSize: '1rem', fontWeight: 500 },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.875rem' },
    button: { textTransform: 'none' as const, fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      } as Partial<TextFieldProps>,
      styleOverrides: {
        root: {
          // Some global styles for text fields if needed
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          // Tailwind handles background/text for appbar via className
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          // Tailwind handles background/text for paper via className
        },
      },
    },
  },
};

// Function to create theme based on current mode
export const getMuiTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#4A3C32' : '#9E8C7F', // Dark Coffee / Light Mocha
        light: mode === 'light' ? '#7A6A5E' : '#C2B5AA', // Muted Coffee / Pale Mocha
        dark: mode === 'light' ? '#2A1C12' : '#7C6A5F', // Very Dark Coffee / Medium Mocha
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: mode === 'light' ? '#8B7D72' : '#E0D8D0', // Warm Gray-Brown / Very Light Tan
        light: mode === 'light' ? '#AF9C90' : '#F0ECE8', // Pale Warm Gray-Brown / Almost White Tan
        dark: mode === 'light' ? '#685C52' : '#BDB3AB', // Dark Warm Gray-Brown / Medium Light Tan
        contrastText: '#210002', // Very dark almost black for contrast
      },
      error: {
        main: '#D32F2F', // Default MUI Red for error
        light: '#EF5350',
        dark: '#C62828',
        contrastText: '#FFFFFF',
      },
      warning: {
        main: '#ED6C02', // Default MUI Orange for warning
        light: '#FF9800',
        dark: '#E65100',
        contrastText: '#FFFFFF',
      },
      info: {
        main: '#0288D1', // Default MUI Blue for info
        light: '#03A9F4',
        dark: '#01579B',
        contrastText: '#FFFFFF',
      },
      success: {
        main: '#2E7D32', // Default MUI Green for success
        light: '#4CAF50',
        dark: '#1B5E20',
        contrastText: '#FFFFFF',
      },
      background: {
        default: mode === 'light' ? '#F8F5F2' : '#2A1C12', // Off-white creamy / Very dark coffee
        paper: mode === 'light' ? '#FFFFFF' : '#4A3C32', // White / Dark coffee
      },
      text: {
        primary: mode === 'light' ? '#333333' : '#F8F8F8', // Dark gray / Off-white
        secondary: mode === 'light' ? '#666666' : '#E0E0E0', // Medium gray / Light gray
      },
    },
    ...commonSettings,
  });
