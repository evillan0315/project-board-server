import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import WorkIcon from '@mui/icons-material/Work';
import LogoutIcon from '@mui/icons-material/Logout';
import type { ProfileMenuItem } from '@/types';

export const profileMenuDefinitions: ProfileMenuItem[] = [
  {
    id: 'profile',
    title: 'Profile',
    description: 'View and edit your personal profile.',
    icon: AccountCircleIcon,
    link: '/profile',
  },
  {
    id: 'user-settings',
    title: 'Settings',
    description: 'Manage your user preferences and account settings.',
    icon: SettingsIcon,
    link: '/settings',
  },
  {
    id: 'projects',
    title: 'Organizations & Projects',
    description: 'View and manage your organizations and projects.',
    icon: WorkIcon,
    link: '/organizations',
  },
  {
    id: 'logout',
    title: 'Logout',
    description: 'Sign out of your account.',
    icon: LogoutIcon,
    action: 'logout',
  },
];
