import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    codeBlockBackground: string;
    inlineCodeBackground: string;
  }
  interface PaletteOptions {
    codeBlockBackground?: string;
    inlineCodeBackground?: string;
  }
}
