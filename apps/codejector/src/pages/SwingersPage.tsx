import React from 'react';
import PageLayout from '@/components/layouts/PageLayout';
import { Box, Typography } from '@mui/material';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import LiveTvIcon from '@mui/icons-material/LiveTv'; // Using LiveTvIcon for streamers
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'; // Using PeopleAltIcon for subscribers

import {
  RoomList,
  RoomHeader, // Import RoomHeader
  StreamerList,
  StreamerHeader,
  SubscriberList,
  SubscriberHeader,
} from '@/components/swingers';
import { DynamicMuiTabs, TabConfig } from '@/components/ui/tabs';
import { GlobalAction } from '@/types/app'; // Import GlobalAction type

/**
 * @interface SwingersPageProps
 * @description Props for the SwingersPage component. Currently empty as no external props are needed.
 */
interface SwingersPageProps {}

const SwingersPage: React.FC<SwingersPageProps> = () => {
  const tabsConfig: TabConfig[] = [
    {
      label: 'Rooms',
      icon: <MeetingRoomIcon />,
      content: (
        <Box className="flex flex-col gap-4 h-full py-4">
          <RoomList />
        </Box>
      ),
    },
    {
      label: 'Streamers',
      icon: <LiveTvIcon />,
      content: (
        <Box className="flex flex-col gap-4 h-full py-4">
          <StreamerList />
        </Box>
      ),
    },
    {
      label: 'Subscribers',
      icon: <PeopleAltIcon />,
      content: (
        <Box className="flex flex-col gap-4 h-full py-4">
          <SubscriberList />
        </Box>
      ),
    },
  ];

  // Define the right actions, including the RoomHeader as a custom component
  const rightActions: GlobalAction[] = [
    {
      component: <RoomHeader />, // Pass RoomHeader directly as a component
    },
  ];

  return (
    <PageLayout
      body={
        <Box className="w-full max-w-screen-2xl mx-auto h-full p-0 pb-2">
          <DynamicMuiTabs
            tabs={tabsConfig}
            tabsClassName="bg-background-paper sticky top-0 z-10 shadow-sm  h-10 p-0 "
            tabPanelClassName="flex-grow p-0 overflow-y-auto"
            rightActions={rightActions} // Pass the right actions here
          />
        </Box>
      }
      bodyPosition={'top'}
      centerBodyPostition={false}
      className="flex-grow" // Allow PageLayout to take full height
    />
  );
};

export default SwingersPage;
