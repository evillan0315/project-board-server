import { AppDefinition } from '@/types';
import AppsIcon from '@mui/icons-material/Apps';
import TerminalIcon from '@mui/icons-material/Terminal';
import TranslateIcon from '@mui/icons-material/Translate';
import BuildIcon from '@mui/icons-material/Build';
import CodeIcon from '@mui/icons-material/Code';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import DescriptionIcon from '@mui/icons-material/Description';
import VideocamIcon from '@mui/icons-material/Videocam';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GitHubIcon from '@mui/icons-material/GitHub'; // for Simple Git
import ForumIcon from '@mui/icons-material/Forum';
import DataObjectIcon from '@mui/icons-material/DataObject'; // For Schema Generator
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'; // NEW: For ChatApp (Direct)
import WebAssetIcon from '@mui/icons-material/WebAsset'; // NEW: For Playwright
import GroupIcon from '@mui/icons-material/Group'; // NEW: For Swingers App

export const appDefinitions: AppDefinition[] = [
  {
    id: 'swingers',
    title: 'Swingers App',
    description: 'Connect with a community of like-minded individuals.',
    link: '/apps/swingers',
    linkText: 'Open Swingers App',
    icon: GroupIcon,
    category: 'Community',
  },
  {
    id: 'ai-editor',
    title: 'AI Editor',
    description: 'Generate code, fix bugs, and refactor your codebase with AI.',
    link: '/ai-editor', // corrected path
    linkText: 'Open AI Editor',
    icon: CodeIcon,
    category: 'AI Tools',
  },
  {
    id: 'ai-chat',
    title: 'AI Chat',
    description: 'Engage in a conversation with AI.',
    link: '/apps/ai-chat',
    linkText: 'Open AI Chat',
    icon: ForumIcon,
    category: 'AI Tools',
  },
  // NEW: App Definition for direct ChatApp component
  {
    id: 'chat-component',
    title: 'Chat App (Direct)',
    description:
      'Direct access to the ChatApp component for testing or specific use.',
    link: '/apps/chat-component',
    linkText: 'Open Direct Chat',
    icon: ChatBubbleOutlineIcon,
    category: 'Development',
  },
  {
    id: 'schema-generator',
    title: 'AI Schema Generator',
    description: 'Generate and manage JSON schemas with AI assistance.',
    link: '/apps/schema-generator',
    linkText: 'Open Schema Generator',
    icon: DataObjectIcon,
    category: 'AI Tools',
  },
  {
    id: 'llm-playwright',
    title: 'LLM Playwright',
    description:
      'Automate web tasks and generate insights with Playwright and AI.',
    link: '/apps/llm-playwright',
    linkText: 'Open Playwright',
    icon: WebAssetIcon,
    category: 'AI Tools',
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'A central hub to manage your projects and applications.',
    link: '/dashboard',
    linkText: 'Open Dashboard',
    icon: DashboardIcon,
    category: 'Management',
  },
  {
    id: 'media-player',
    title: 'Media Player',
    description: 'Explore and enjoy a simulated music streaming experience.',
    link: '/apps/spotify',
    linkText: 'Open Music Player',
    icon: LibraryMusicIcon,
    category: 'Entertainment',
  },
  {
    id: 'terminal',
    title: 'Terminal',
    description: 'Access to Terminal for project automation.',
    link: '/apps/terminal',
    linkText: 'Open Terminal',
    icon: TerminalIcon,
    category: 'Development',
  },
  {
    id: 'preview',
    title: 'Preview App',
    description:
      'Preview a successfully built frontend application in an iframe.',
    link: '/apps/preview',
    linkText: 'Open Preview',
    icon: BuildIcon,
    category: 'Development',
  },
  {
    id: 'llm-generation',
    title: 'LLM Code Generator',
    description: 'Generate any code using LLM.',
    link: '/apps/llm-generation',
    linkText: 'Open Code Generator',
    icon: AppsIcon,
    category: 'AI Tools',
  },
  {
    id: 'transcription',
    title: 'Transcription App',
    description: 'Transcribe audio files to text.',
    link: '/apps/transcription',
    linkText: 'Open Transcription',
    icon: AppsIcon,
    category: 'Utilities',
  },
  {
    id: 'organizations',
    title: 'Organizations',
    description: 'Manage organizations and projects.',
    link: '/organizations',
    linkText: 'Open Organizations',
    icon: AppsIcon,
    category: 'Management',
  },
  {
    id: 'profile',
    title: 'User Profile',
    description: 'View and manage your user profile.',
    link: '/profile',
    linkText: 'Open Profile',
    icon: AccountCircleIcon,
    category: 'User',
  },
  {
    id: 'settings',
    title: 'User Settings',
    description: 'Configure your user settings.',
    link: '/settings',
    linkText: 'Open Settings',
    icon: SettingsIcon,
    category: 'User',
  },
  {
    id: 'recording',
    title: 'Recording App',
    description: 'Record your screen.',
    link: '/apps/recording',
    linkText: 'Open Recording',
    icon: VideocamIcon,
    category: 'Utilities',
  },
  {
    id: 'kanban-board',
    title: 'Project Kanban Board',
    description: 'Manage your projects using a Kanban board.',
    link: '/apps/kanban-board',
    linkText: 'Open Kanban Board',
    icon: AssignmentIcon,
    category: 'Management',
  },
  {
    id: 'simple-git',
    title: 'Simple Git',
    description: 'Lightweight Git interface for basic operations.',
    link: '/apps/simple-git',
    linkText: 'Open Simple Git',
    icon: GitHubIcon,
    category: 'Development',
  },
];
