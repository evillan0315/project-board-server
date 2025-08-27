import { createTheme, PaletteMode, alpha } from '@mui/material/styles';
import { grey, blue, common, red, green, amber, indigo, blueGrey, brown, teal, cyan } from '@mui/material/colors';

declare module '@mui/material/styles' {
  interface TypeText {
    muted?: string;
  }
  interface SimplePaletteColorOptions {
    lighter?: string;
    darker?: string;
  }
  interface PaletteColor {
    lighter?: string;
    darker?: string;
  }
}

export const getTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: blueGrey[800],
        light: blueGrey[100],
        dark: blueGrey[900],
        contrastText: common.white,
      },
      secondary: {
        main: grey[500],
        light: grey[300],
        dark: grey[700],
        contrastText: common.white,
      },
      error: {
        main: red[500],
      },
      warning: {
        main: amber[500],
      },
      info: {
        main: blue[500],
      },
      success: {
        main: green[500],
      },
      text: {
        primary: mode === 'light' ? grey[900] : common.white,
        secondary: mode === 'light' ? grey[700] : grey[400],
        disabled: mode === 'light' ? grey[500] : grey[600],
        muted: mode === 'light' ? grey[600] : grey[500],
      },
      background: {
        default: mode === 'light' ? grey[50] : grey[900],
        paper: mode === 'light' ? common.white : grey[800],
      },
      divider: mode === 'light' ? grey[200] : grey[700],
    },
    typography: {
      fontFamily: ['Inter', 'sans-serif'].join(','),
      h1: {
        fontSize: '3rem',
        fontWeight: 700,
      },
      h5: {
        fontWeight: 700,
      },
      h6: {
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
      },
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: ({ ownerState, theme }) => ({
            ...(ownerState.variant === 'contained' &&
              ownerState.color === 'primary' && {
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              }),
            ...(ownerState.variant === 'outlined' &&
              ownerState.color === 'secondary' && {
                borderColor: alpha(theme.palette.secondary.main, 0.5),
                '&:hover': {
                  borderColor: theme.palette.secondary.main,
                  backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                },
              }),
          }),
        },
      },
      MuiTextField: {
        defaultProps: {
          fullWidth: true,
          margin: 'normal',
          variant: 'outlined',
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            // Ensures AppBar background adheres to theme primary color without explicit overrides
            backgroundColor: theme.palette.primary.main,
          }),
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            // Ensures AppBar background adheres to theme primary color without explicit overrides
            backgroundColor: theme.palette.primary.main,
          }),
        },
      },
      MuiLink: {
        styleOverrides: {
          root: ({ ownerState, theme }) => ({
            ...(ownerState.underline === 'hover' && {
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            }),
            color: theme.palette.text.primary,
          }),
        },
      },
    },
  });

