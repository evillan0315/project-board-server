import React, { ReactNode } from 'react';
import { Box, Paper, Typography, useTheme, SxProps } from '@mui/material';
import GlobalActionButton, {
  GlobalAction,
} from '@/components/ui/GlobalActionButton';

/**
 * Props for the PageHeader component.
 */
interface PageHeaderProps {
  /** The title of the page, can be a string or any ReactNode. */
  title: string | ReactNode;
  /** Optional array of actions to display on the right side, using GlobalActionButton. */
  actions?: GlobalAction[];
  /** If true, the header will stick to the top when scrolling. Defaults to false. */
  sticky?: boolean;
  /** Optional custom styling for the root Paper component. */
  sx?: SxProps;
}

/**
 * Defines the Material UI and Tailwind CSS styles for the PageHeader's root Paper component.
 * @param theme The current MUI theme.
 * @param sticky A boolean indicating if the header should be sticky.
 * @returns A SxProps object for the Paper component.
 */
const headerPaperSx = (
  theme: ReturnType<typeof useTheme>,
  sticky: boolean,
): SxProps => ({
  borderRadius: 0,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  borderBottom: `1px solid ${theme.palette.divider}`,
  zIndex: 100, // Ensure it stays on top of other content
  // Tailwind classes for layout, converted to sx prop
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: '48px',
  boxShadow: 0,
  ...(sticky && {
    position: 'sticky',
    top: 0,
    left: 0, // Ensure it spans the full width
    width: '100%', // Ensure sticky element takes full width
  }),
});

/**
 * `PageHeader` is a layout component for displaying a page title and optional global actions.
 * It can be configured to be sticky at the top of the viewport.
 *
 * @param {PageHeaderProps} props - The properties for the component.
 * @returns {React.FC} A React functional component.
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  actions,
  sticky = false,
  sx,
}) => {
  const theme = useTheme();

  return (
    <Paper className='gap-2' sx={(t) => ({ ...headerPaperSx(t, sticky), ...sx })}>
      <Box className="flex-grow">
        {typeof title === 'string' ? (
          <Typography
            variant="h6"
            component="h1"
            className="text-xl font-semibold"
          >
            {title}
          </Typography>
        ) : (
          title
        )}
      </Box>
      {actions && actions.length > 0 && (
        <GlobalActionButton globalActions={actions} />
      )}
    </Paper>
  );
};

export default PageHeader;
