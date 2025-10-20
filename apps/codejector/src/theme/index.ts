import { createTheme, ThemeOptions } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// Define common Tailwind values for conversion
const tailwindFontSize = {
  '3xl': '1.875rem', // 30px
  '2xl': '1.5rem', // 24px
  'xl': '1.25rem', // 20px
  'sm': '0.875rem', // 14px
};

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
      // Custom colors for code blocks
      codeBlockBackground: mode === 'dark' ? '#282c34' : '#f6f8fa',
      inlineCodeBackground: mode === 'dark' ? '#424242' : '#e0e0e0',
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
        styleOverrides: (theme) => ({
          // Define CSS variables for markdown styling, mapping to MUI theme colors or specific values
          ':root': {
            '--color-text': theme.palette.text.primary,
            '--color-border': theme.palette.divider,
            '--color-hover': theme.palette.action.hover,
            '--btn-hover-text': theme.palette.info.main,
            '--btn-icon-hover': theme.palette.info.dark,
            '--color-sky-400': '#7dd3fc', // Tailwind sky-400 hex
            '--color-gray-500': '#6b7280', // Tailwind gray-500 hex
            '--color-warning': theme.palette.warning.main,
            '--color-muted': theme.palette.text.secondary,
            '--color-maroon-400': '#ef4444', // Equivalent to Tailwind red-500 or error.light
            '--color-indigo-400': '#818cf8', // Tailwind indigo-400 hex
            '--color-red-500': theme.palette.error.main,
            '--color-burn': theme.palette.secondary.dark, // Using secondary.dark as a plausible equivalent
            '--color-error': theme.palette.error.main,
            '--color-success': theme.palette.success.main,
            '--color-bg': theme.palette.background.paper, // For CodeMirror gutters background
          },
          // Global utility styles from markdown.css
          '.group:hover button': {
            opacity: 1,
          },
          '.transition-opacity': {
            transitionProperty: 'opacity',
          },
          '.language-btn': {
            backgroundColor: '#0ea5e9', // Tailwind bg-sky-500
          },
          // Keyframes and typewriter cursor styles
          '@keyframes blink': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0 },
          },
          '.typewriter-cursor': {
            animation: 'blink 0.8s infinite steps(1)',
            marginLeft: '2px',
            fontWeight: 'bold',
          },
          // Prose-related styles (assuming it refers to typography plugin's output)
          '.prose p': {
            fontSize: '1.1em',
          },
          '.prose ul': {
            paddingLeft: '1.25em',
          },
          '.prose ol': {
            paddingLeft: '1.25em',
          },
          '.prose li': {
            marginBottom: '0.25em',
          },

          // Markdown Body specific styles, converted from Tailwind and custom CSS
          '.markdown-body': {
            fontWeight: 'normal',
            color: 'var(--color-text)', // Uses defined CSS variable
            lineHeight: '1.625', // Tailwind leading-relaxed
            letterSpacing: '0em', // Tailwind tracking-normal
            backgroundColor: mode === 'dark' ? '#1d1d1d' : '#f5f5f5', // Merged from existing theme

            '& h1': {
              fontSize: tailwindFontSize['3xl'], // Tailwind text-3xl
              fontWeight: theme.typography.fontWeightBold, // Tailwind font-bold
              marginTop: theme.spacing(4), // Tailwind mt-8 (32px)
              marginBottom: theme.spacing(2), // Tailwind mb-4 (16px)
              paddingBottom: theme.spacing(1), // Tailwind pb-2 (8px)
              borderBottom: `1px solid var(--color-border)`, // Uses defined CSS variable
            },
            '& h2': {
              fontSize: tailwindFontSize['2xl'], // Tailwind text-2xl
              fontWeight: theme.typography.fontWeightSemiBold, // Tailwind font-semibold
              marginTop: theme.spacing(3), // Tailwind mt-6 (24px)
              marginBottom: theme.spacing(1.5), // Tailwind mb-3 (12px)
              paddingBottom: theme.spacing(0.5), // Tailwind pb-1 (4px)
              borderBottom: `1px solid var(--color-border)`, // Uses defined CSS variable
            },
            '& h3': {
              fontSize: tailwindFontSize['xl'], // Tailwind text-xl
              fontWeight: theme.typography.fontWeightMedium, // Tailwind font-medium
              marginTop: theme.spacing(2), // Tailwind mt-4 (16px)
              marginBottom: theme.spacing(1), // Tailwind mb-2 (8px)
            },
            '& h4, & h5': {
              marginTop: theme.spacing(1.5), // Custom approx. based on original margins
              marginBottom: theme.spacing(1.5),
            },
            '& p': {
              marginBottom: theme.spacing(2), // Tailwind mb-4 (16px)
            },
            '& ul, & ol': {
              paddingLeft: theme.spacing(3), // Tailwind pl-6 (24px)
              marginBottom: theme.spacing(2), // Tailwind mb-4 (16px)
              listStyleType: 'disc', // Default for ul
              '& li': {
                marginBottom: theme.spacing(0.5), // Original 0.5rem (8px)
              },
            },
            '& ol': {
              listStyleType: 'decimal',
            },
            '& blockquote': {
              borderLeft: `4px solid var(--color-border)`,
              backgroundColor: 'var(--color-hover)',
              color: 'var(--color-text)',
              paddingLeft: theme.spacing(2), // Tailwind pl-4 (16px)
              fontStyle: 'italic',
              paddingTop: theme.spacing(1), // Tailwind py-2 (8px)
              paddingBottom: theme.spacing(1),
              borderRadius: theme.shape.borderRadius, // Tailwind rounded
            },
            '& a': {
              color: 'var(--btn-hover-text)', // Uses defined CSS variable
              textDecoration: 'underline',
              transition: theme.transitions.create('color'), // Tailwind transition-colors
              '&:hover': {
                color: 'var(--btn-icon-hover)', // Uses defined CSS variable
              },
            },
            '& hr': {
              border: 'none',
              borderBottom: `1px solid ${theme.palette.primary.main}`, // Tailwind border-color: var(--mui-palette-primary-main);
              marginTop: theme.spacing(3), // Tailwind my-6 (24px)
              marginBottom: theme.spacing(3),
            },
            '& table': {
              width: '100%', // Tailwind w-full
              tableLayout: 'auto', // Tailwind table-auto
              borderCollapse: 'collapse',
              fontSize: theme.typography.body2.fontSize, // Changed from tailwindFontSize.sm to theme.typography
              marginTop: theme.spacing(2), // Tailwind my-4 (16px)
              marginBottom: theme.spacing(2),
              border: `1px solid ${theme.palette.divider}`, // Retained from existing theme
            },
            '& th': {
              border: `1px solid var(--color-border)`,
              backgroundColor: 'var(--color-hover)',
              color: 'var(--color-text)',
              fontWeight: theme.typography.fontWeightSemiBold, // Tailwind font-semibold
              paddingLeft: theme.spacing(1), // Tailwind px-2 (8px)
              paddingRight: theme.spacing(1),
              paddingTop: theme.spacing(0.5), // Tailwind py-1 (4px)
              paddingBottom: theme.spacing(0.5),
            },
            '& td': {
              border: `1px solid var(--color-border)`,
              color: 'var(--color-text)',
              paddingLeft: theme.spacing(1), // Tailwind px-2 (8px)
              paddingRight: theme.spacing(1),
              paddingTop: theme.spacing(0.5), // Tailwind py-1 (4px)
              paddingBottom: theme.spacing(0.5),
            },
            '& img': {
              maxWidth: '100%', // Tailwind max-w-full
              borderRadius: theme.shape.borderRadius, // Tailwind rounded
              boxShadow: theme.shadows[1], // Tailwind shadow
            },
          },
          // CodeMirror markdown-related styles
          '.markdown-code-wrapper .cm-scroller': {
            overflow: 'auto',
            maxHeight: '400px',
            border: `1px solid var(--color-border)`,
            borderRadius: theme.shape.borderRadius, // From rounded-b-md, assuming full rounded applies to top as well
            // For specific rounded-b-md:
            // borderBottomLeftRadius: theme.shape.borderRadius,
            // borderBottomRightRadius: theme.shape.borderRadius,
          },
          '.markdown-code-wrapper .cm-content': {
            margin: 0, // Tailwind space-y-0
          },
          '.markdown-code-wrapper > .cm-editor': {
            marginTop: '2em',
            marginBottom: '2em',
            overflow: 'auto',
            boxShadow: theme.shadows[3], // Tailwind shadow-lg
            '& .cm-content': {
              margin: 0, // Tailwind space-y-0
            },
            overflowWrap: 'anywhere',
          },

          // CodeMirror general gutter styles
          '.cm-editor .cm-gutters': {
            backgroundColor: 'var(--color-bg)', // Uses mapped CSS variable
          },

          // Syntax Highlighting token colors
          '.token.string': {
            color: 'var(--color-text)',
          },
          '.token.regex': {
            color: 'var(--color-gray-500)',
          },
          '.token.variable': {
            color: 'var(--color-text)',
          },
          '.token.keyword': {
            color: 'var(--color-warning)',
          },
          '.token.punctuation': {
            color: 'var(--color-text)',
          },
          '.token.comment': {
            color: 'var(--color-muted)',
          },
          '.token.char': {
            color: 'var(--color-sky-400)',
          },
          '.token.builtin': {
            color: 'var(--color-success)',
          },
          '.token.boolean': {
            color: 'var(--color-maroon-400)',
          },
          '.token.generic-function': {
            color: 'var(--color-indigo-400)',
          },
          '.token.operator': {
            color: 'var(--color-red-500)',
          },
          '.token.constant': {
            color: 'var(--color-burn)',
          },
          '.token.class-name': {
            color: 'var(--color-error)',
          },
        }),
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
