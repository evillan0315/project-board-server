import React from 'react';
import { Link } from 'react-router-dom';
import { AppDefinition } from '@/types';

import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';

interface AppsMenuContentProps {
  apps: AppDefinition[];
  onClose: () => void;
}

const AppsMenuContent: React.FC<AppsMenuContentProps> = ({ apps, onClose }) => {
  const theme = useTheme();

  return (
    <>
      {apps.map((app, index) => (
        <React.Fragment key={app.id}>
          <MenuItem
            component={Link}
            to={app.link}
            onClick={onClose}
            sx={{
              py: 1.5,
              '&:hover': { bgcolor: theme.palette.action.hover },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
              <app.icon color="primary" />
            </ListItemIcon>
            <Typography variant="body1" fontWeight="medium">
              {app.title}
            </Typography>
          </MenuItem>
          {index !== apps.length - 1 && (
            <Divider sx={{ bgcolor: theme.palette.divider }} />
          )}
        </React.Fragment>
      ))}
    </>
  );
};

export default AppsMenuContent;
