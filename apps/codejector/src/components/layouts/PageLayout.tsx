import React, { ReactNode } from 'react';
import {
  Box,
  useTheme,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
interface PageLayoutProps {
  header?: ReactNode;
  body: ReactNode;
  footer?: ReactNode;
  centerBodyContent?: boolean;
  bodyPosition?: 'top' | 'left';
  isFooterVisible?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  header,
  body,
  footer,
  centerBodyContent = true,
  bodyPosition = 'top',
  isFooterVisible = true,
}) => {
  const theme = useTheme();

  const bodyStyles = {
    display: 'flex',
    flexGrow: 1,
    overflow: 'auto',
    ...(centerBodyContent
      ? {
          justifyContent: 'center',
          alignItems: 'center',
        }
      : bodyPosition === 'top'
        ? {
            alignItems: 'flex-start',
          }
        : {
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
          }),
  };

  return (
    <Box
      className="h-screen flex flex-col overflow-hidden"
      sx={{ backgroundColor: theme.palette.background.default }}
    >
      {header && (
        <AppBar
          sx={{
            position: 'relative',
            p: 0,
            '& .MuiToolbar-root': { p: 0, minHeight: 20 },
          }}
        >
          <Toolbar>{header}</Toolbar>
        </AppBar>
      )}

      <Box className="flex-grow w-full overflow-auto" sx={bodyStyles}>
        {body}
      </Box>

      {isFooterVisible && footer && (
        <Box
          className="w-full flex-shrink-0"
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
            padding: theme.spacing(1),
          }}
        >
          {footer}
        </Box>
      )}
    </Box>
  );
};

export default PageLayout;
