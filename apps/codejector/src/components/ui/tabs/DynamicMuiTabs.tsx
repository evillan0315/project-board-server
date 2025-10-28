import React, { useState, SyntheticEvent, ReactNode } from 'react';
import { Tabs, Tab, Box, Paper, useTheme } from '@mui/material';
import { TabPanel, a11yProps } from './TabPanel';
import GlobalActionButton from '@/components/ui/GlobalActionButton';
import { GlobalAction } from '@/types/app';

// --- Interfaces ---
/**
 * @interface TabConfig
 * @description Configuration for a single tab, including its label, icon, and content.
 * @property {string} label - The text label displayed on the tab.
 * @property {ReactNode} content - The content to be rendered when this tab is active.
 * @property {ReactNode} [icon] - Optional icon to display alongside the label.
 */
export interface TabConfig {
  label: string;
  content: ReactNode;
  icon?: ReactNode;
}
/**
 * @interface DynamicMuiTabsProps
 * @description Props for the DynamicMuiTabs component.
 * @property {TabConfig[]} tabs - An array of tab configurations to render.
 * @property {number} [initialTabIndex=0] - The index of the tab to be active initially.
 * @property {object} [tabsSx] - Custom Material UI sx prop for the Tabs component.
 * @property {object} [tabPanelSx] - Custom Material UI sx prop for the active TabPanel content wrapper.
 * @property {string} [tabsClassName] - Custom Tailwind CSS classes for the Tabs component.
 * @property {string} [tabPanelClassName] - Custom Tailwind CSS classes for the active TabPanel content wrapper.
 * @property {GlobalAction[]} [leftActions] - Optional array of actions to display as buttons on the left.
 * @property {GlobalAction[]} [rightActions] - Optional array of actions to display as buttons on the right.
 */
export interface DynamicMuiTabsProps {
  tabs: TabConfig[];
  initialTabIndex?: number;
  tabsSx?: object;
  tabPanelSx?: object;
  tabsClassName?: string;
  tabPanelClassName?: string;
  leftActions?: GlobalAction[];
  rightActions?: GlobalAction[];
}

// --- Styles ---
const dynamicTabsRootSx = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
};

const tabsContainerSx = {
  borderBottom: 1,
  borderColor: 'divider',
  // Fixed height for the tabs container, similar to FileTabs
  height: '49px',
  borderRadius: 0,
  flexShrink: 0,
  // Layout for content inside Paper
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'start',
  overflowX: 'auto', // Allow horizontal scrolling if tabs and buttons combined are too wide
  whiteSpace: 'nowrap', // Prevent wrapping if content needs it (mostly tabs)
  scrollbarWidth: 'none', // Hide scrollbar for Firefox
  '&::-webkit-scrollbar': {
    display: 'none', // Hide scrollbar for Chrome, Safari, Edge
  },
};

// Styles for the Mui Tabs component itself
const tabsComponentSx = (theme: ReturnType<typeof useTheme>) => ({
  flexGrow: 1, // Allow tabs to grow horizontally within its container
  // maxWidth: 'calc(100% - 160px)', // Only if there are consistent action buttons to reserve space
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
  },
  '& .MuiTab-root': {
    color: theme.palette.text.secondary,
    minHeight: '48px', // Keep consistent with FileTabs
    padding: '6px 12px',
    textTransform: 'none', // Keep text as is
    fontSize: '0.875rem',
    '&.Mui-selected': {
      color: theme.palette.text.primary,
      fontWeight: 'bold',
      backgroundColor: theme.palette.background.paper, // Differentiate active tab background
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
});

const defaultTabPanelContentSx = {
  flexGrow: 1, // Allow content area to take remaining vertical space
  height: '100%', // Take full height within its flex item
};

export const DynamicMuiTabs: React.FC<DynamicMuiTabsProps> = ({
  tabs,
  initialTabIndex = 0,
  tabsSx,
  tabPanelSx,
  tabsClassName,
  tabPanelClassName,
  leftActions,
  rightActions,
}) => {
  const [value, setValue] = useState(initialTabIndex);
  const theme = useTheme();
  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Separate actions into custom components and standard GlobalActions
  const customRightComponents = rightActions?.filter(action => action.component);
  const standardRightActions = rightActions?.filter(action => !action.component);

  const customLeftComponents = leftActions?.filter(action => action.component);
  const standardLeftActions = leftActions?.filter(action => !action.component);


  return (
    <Box sx={dynamicTabsRootSx} className="w-full h-full flex flex-col">
      <Paper sx={{ ...tabsContainerSx, ...tabsSx }} className={tabsClassName}>
        {customLeftComponents && customLeftComponents.length > 0 && (
          <Box className="flex items-center gap-0 mr-1 pl-1">
            {customLeftComponents.map((action, index) => (
              <React.Fragment key={index}>{action.component}</React.Fragment>
            ))
            }
          </Box>
        )}
        {standardLeftActions && standardLeftActions.length > 0 && (
          <Box className="flex items-center gap-0 mr-1 pl-1">
            <GlobalActionButton globalActions={standardLeftActions} iconOnly={true} />
          </Box>
        )}
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="dynamic tabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={tabsComponentSx(theme)} // Apply new shared styles here
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              {...a11yProps(index)}
              // No inline sx here for general tab styling, moved to tabsComponentSx
            />
          ))}
        </Tabs>
        {standardRightActions && standardRightActions.length > 0 && (
          <Box className="flex items-center gap-0 ml-auto pr-1">
            <GlobalActionButton globalActions={standardRightActions} iconOnly={true} />
          </Box>
        )}
        {customRightComponents && customRightComponents.length > 0 && (
          <Box className="flex items-center gap-0 ml-auto pr-1">
            {customRightComponents.map((action, index) => (
              <React.Fragment key={index}>{action.component}</React.Fragment>
            ))
            }
          </Box>
        )}
      </Paper>
      {tabs.map((tab, index) => (
        <TabPanel
          key={index}
          value={value}
          index={index}
          sx={{ ...defaultTabPanelContentSx, ...tabPanelSx }} // Merge with default content styles
          className={tabPanelClassName}
        >
          {tab.content}
        </TabPanel>
      ))}
    </Box>
  );
};
