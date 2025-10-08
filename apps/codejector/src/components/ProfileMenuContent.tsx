import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  useTheme,
  CardActionArea,
  Tooltip,
  Avatar,
} from '@mui/material';
import type { ProfileMenuItem, UserProfile } from '@/types'; // Fixed import

interface ProfileMenuContentProps {
  profileItems: ProfileMenuItem[];
  onClose: () => void;
  onLogout: () => void; // Passed from Navbar to handle logout action
  user: UserProfile | null; // New: Pass user object for profile details
}

const ProfileMenuContent: React.FC<ProfileMenuContentProps> = ({
  profileItems,
  onClose,
  onLogout,
  user,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ p: 1, minWidth: 250, maxWidth: 400 }}>
      {/* New: Profile Card Header */}
      {user && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 2,
            pb: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
            mb: 1,
            bgcolor: theme.palette.action.hover,
            borderRadius: 1,
            mx: 1,
          }}
        >
          <Avatar
            alt={user.name || user.username || user.email || 'User'}
            src={user.image || undefined} // Use user.image dynamically
            sx={{ width: 48, height: 48 }}
          />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {user.name || user.username || user.email}
            </Typography>
            {user.organization && (
              <Typography variant="body2" color="text.secondary">
                {user.organization}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      {/* End Profile Card Header */}

      {/* Original Menu Items */}
      <Grid container spacing={1}>
        {profileItems.map((item) => (
          <Grid item xs={6} key={item.id}>
            <Tooltip title={item.description || item.title} placement="right">
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: theme.palette.background.default,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'background-color 0.2s, border-color 0.2s',
                  '&:hover': { bgcolor: theme.palette.action.hover },
                }}
              >
                {item.link ? (
                  <CardActionArea
                    component={Link}
                    to={item.link}
                    onClick={onClose}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      p: 1.5,
                      textAlign: 'center',
                      textDecoration: 'none',
                      color: theme.palette.text.primary,
                    }}
                  >
                    <item.icon
                      sx={{
                        fontSize: 24,
                        color: theme.palette.primary.main,
                        mb: 0.5,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 'bold',
                        lineHeight: 'tight',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {item.title}
                    </Typography>
                  </CardActionArea>
                ) : item.action === 'logout' ? (
                  <CardActionArea
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      p: 1.5,
                      textAlign: 'center',
                      textDecoration: 'none',
                      color: theme.palette.error.main,
                    }}
                  >
                    <item.icon
                      sx={{
                        fontSize: 24,
                        color: theme.palette.error.main,
                        mb: 0.5,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 'bold',
                        lineHeight: 'tight',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        color: 'inherit',
                      }}
                    >
                      {item.title}
                    </Typography>
                  </CardActionArea>
                ) : null}
              </Card>
            </Tooltip>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ProfileMenuContent;
