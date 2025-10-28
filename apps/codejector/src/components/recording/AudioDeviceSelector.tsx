import React from 'react';
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Divider } from '@mui/material';
import { DeviceDto } from '@/types/refactored/media'; // Adjust import as needed

interface AudioDeviceSelectorProps {
  devices: DeviceDto[]; // Changed to DeviceDto array
  onSelect: (device: string | null) => void;
  defaultSelection?: string | null;
}

const AudioDeviceSelector: React.FC<AudioDeviceSelectorProps> = ({ devices, onSelect, defaultSelection }) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Select Audio Input Device for Screen Recording
      </Typography>
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => onSelect(null)} selected={defaultSelection === null || defaultSelection === ''}>
            <ListItemText primary="None (No Audio)" />
          </ListItemButton>
        </ListItem>
        <Divider />
        {devices.map((device) => (
          <ListItem key={device.id} disablePadding>
            <ListItemButton onClick={() => onSelect(device.id)} selected={defaultSelection === device.id}>
              <ListItemText primary={device.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
export default AudioDeviceSelector;
