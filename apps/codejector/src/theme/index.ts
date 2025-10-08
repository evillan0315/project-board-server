// src/theme/getAppTheme.ts
import { createTheme, ThemeOptions } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

export const getAppTheme = (mode: PaletteMode) => {
  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#90caf9' : '#1976d2',
        light: mode === 'dark' ? '#e3f2fd' : '#42a5f5',
        dark: mode === 'dark' ? '#42a5f5' : '#1565c0',
        contrastText: mode === 'dark' ? '#000000' : '#ffffff',
      },
      secondary: {
        main: mode === 'dark' ? '#f48fb1' : '#dc004e',
        light: mode === 'dark' ? '#ffc1e3' : '#ff4081',
        dark: mode === 'dark' ? '#c75a85' : '#c51162',
        contrastText: mode === 'dark' ? '#000000' : '#ffffff',
      },
      error: {
        main: mode === 'dark' ? '#ef9a9a' : '#d32f2f',
        light: mode === 'dark' ? '#ffcdd2' : '#e57373',
        dark: mode === 'dark' ? '#c62828' : '#c62828',
        contrastText: mode === 'dark' ? '#000000' : '#ffffff',
      },
      warning: {
        main: mode === 'dark' ? '#ffb74d' : '#ff9800',
        light: mode === 'dark' ? '#ffecb3' : '#ffb74d',
        dark: mode === 'dark' ? '#c67b00' : '#f57c00',
        contrastText: mode === 'dark' ? '#000000' : '#ffffff',
      },
      info: {
        main: mode === 'dark' ? '#64b5f6' : '#2196f3',
        light: mode === 'dark' ? '#bbdefb' : '#64b5f6',
        dark: mode === 'dark' ? '#0d47a1' : '#1976d2',
        contrastText: mode === 'dark' ? '#000000' : '#ffffff',
      },
      success: {
        main: mode === 'dark' ? '#81c784' : '#4caf50',
        light: mode === 'dark' ? '#c8e6c9' : '#81c784',
        dark: mode === 'dark' ? '#2e7d32' : '#388e3c',
        contrastText: mode === 'dark' ? '#000000' : '#ffffff',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f9f9f9',
        paper: mode === 'dark' ? '#1d1d1d' : '#f5f5f5',
      },
      text: {
        primary: mode === 'dark' ? '#ffffff' : '#212121',
        secondary: mode === 'dark' ? '#bdbdbd' : '#757575',
        disabled: mode === 'dark' ? '#8d8d8d' : '#aaaaaa',
      },
      divider:
        mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    },
    typography: {
      fontFamily: ['Inter', 'sans-serif'].join(','),
      h1: { fontSize: '3.5rem' },
      h2: { fontSize: '3rem' },
      h3: { fontSize: '2.5rem' },
      h4: { fontSize: '2rem' },
      h5: { fontSize: '1.5rem' },
      h6: { fontSize: '1.25rem' },
      body1: { fontSize: '1rem' },
      body2: { fontSize: '0.875rem' },
      button: { textTransform: 'none' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '.markdown-body': {
            backgroundColor: mode === 'dark' ? '#1d1d1d' : '#f5f5f5',
          },
                    '.cm-editor .cm-gutters': {
            backgroundColor: mode === 'dark' ? '#1d1d1d' : '#f5f5f5',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? '#bdbdbd' : '#757575',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.04)'
                  : 'rgba(0, 0, 0, 0.04)',
            },
          },
          colorPrimary: {
            color: mode === 'dark' ? '#90caf9' : '#1976d2',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(144, 202, 249, 0.08)'
                  : 'rgba(25, 118, 210, 0.08)',
            },
          },
          colorSecondary: {
            color: mode === 'dark' ? '#f48fb1' : '#dc004e',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(244, 143, 177, 0.08)'
                  : 'rgba(220, 0, 78, 0.08)',
            },
          },
          colorError: {
            color: mode === 'dark' ? '#ef9a9a' : '#d32f2f',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(239, 154, 154, 0.08)'
                  : 'rgba(211, 47, 47, 0.08)',
            },
          },
          colorWarning: {
            color: mode === 'dark' ? '#ffb74d' : '#ff9800',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(255, 183, 77, 0.08)'
                  : 'rgba(255, 152, 0, 0.08)',
            },
          },
          colorInfo: {
            color: mode === 'dark' ? '#64b5f6' : '#2196f3',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(100, 181, 246, 0.08)'
                  : 'rgba(33, 150, 243, 0.08)',
            },
          },
          colorSuccess: {
            color: mode === 'dark' ? '#81c784' : '#4caf50',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(129, 199, 132, 0.08)'
                  : 'rgba(76, 175, 80, 0.08)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: ({ theme }) => ({
            //border: `1px solid ${theme.palette.divider}`,
            //backgroundColor: theme.palette.background.paper,
          }),
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundColor: theme.palette.background.default,
            borderRadius: 6,
          }),
        },
      },
    },
  };

  return createTheme(themeOptions);
};
