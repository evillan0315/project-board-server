import { createTheme } from '@mui/material/styles';
import type { TextFieldProps } from '@mui/material/TextField'; // Import for type casting

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
    button: { textTransform: 'none' as const, fontWeight: 600 }, // Added 'as const' for strict type checking
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
      } as Partial<TextFieldProps>, // Cast to Partial<TextFieldProps> to correctly type 'variant' literal
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
        main: mode === 'light' ? '#075985' : '#7dd3fc', // Tailwind sky-900 / sky-300
        light: mode === 'light' ? '#38bdf8' : '#e0f2fe', // Tailwind sky-500 / sky-100
        dark: mode === 'light' ? '#0c4a6e' : '#0ea5e9', // Tailwind sky-950 / sky-400
        contrastText: mode === 'light' ? '#ffffff' : '#0f172a', // White / slate-900
      },
      secondary: {
        main: mode === 'light' ? '#2563eb' : '#93c5fd', // Tailwind blue-600 / blue-300
        light: mode === 'light' ? '#60a5fa' : '#dbeafe', // Tailwind blue-400 / blue-100
        dark: mode === 'light' ? '#1d4ed8' : '#3b82f6', // Tailwind blue-700 / blue-500
        contrastText: mode === 'light' ? '#ffffff' : '#1e3a8a', // White / blue-900
      },
      error: {
        main: '#ef4444', // Tailwind red-500
        contrastText: '#ffffff',
      },
      warning: {
        main: '#f97316', // Tailwind orange-500
        contrastText: '#ffffff',
      },
      info: {
        main: '#3b82f6', // Tailwind blue-500
        contrastText: '#ffffff',
      },
      success: {
        main: '#22c55e', // Tailwind green-500
        contrastText: '#ffffff',
      },
      background: {
        default: mode === 'light' ? '#f8fafc' : '#0f172a', // Tailwind slate-50 / slate-950
        paper: mode === 'light' ? '#ffffff' : '#1e293b', // White / slate-800
      },
      text: {
        primary: mode === 'light' ? '#1f2937' : '#f9fafb', // Gray-800 / Gray-50
        secondary: mode === 'light' ? '#4b5563' : '#e5e7eb', // Gray-600 / Gray-200
      },
    },
    ...commonSettings,
  });
