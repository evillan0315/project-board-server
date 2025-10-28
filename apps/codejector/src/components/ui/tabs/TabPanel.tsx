import React, { ReactNode } from 'react';
import { Box } from '@mui/material';

/**
 * @interface TabPanelProps
 * @description Props for the TabPanel component.
 * @property {ReactNode} [children] - The content to be rendered inside the tab panel.
 * @property {number} index - The index of this tab panel.
 * @property {number} value - The currently active tab's value, used to determine visibility.
 * @property {string} [className] - Custom Tailwind CSS classes for the root Box element.
 * @property {object} [sx] - Custom Material UI sx prop for the root Box element.
 */
interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
  className?: string;
  sx?: object;
}

/**
 * @function a11yProps
 * @description Generates accessibility properties for a tab and its corresponding panel.
 * @param {number} index - The index of the tab/panel.
 * @returns {object} Accessibility properties.
 */
export const a11yProps = (index: number) => {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
};

/**
 * @component TabPanel
 * @description A component to display content for a single tab, managing its visibility based on the active tab.
 * @param {TabPanelProps} props - The props for the TabPanel component.
 */
export const TabPanel: React.FC<TabPanelProps> = ({
  children, value, index, className, sx, ...other
}) => {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      className={className}
      sx={sx}
      {...other}
    >
      {value === index && <Box className="w-full h-full p-0">{children}</Box>}
    </Box>
  );
};
