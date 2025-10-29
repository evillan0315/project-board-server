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
import AssistantIcon from '@mui/icons-material/Assistant'; // NEW: For AI Assistant
import TextSnippetIcon from '@mui/icons-material/TextSnippet'; // NEW: For Documentation Editor
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'; // NEW: For Task Manager
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'; // NEW: For Code Playground
import FolderSharedIcon from '@mui/icons-material/FolderShared'; // NEW: For File Explorer
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck'; // NEW: For Network Monitor
import MicIcon from '@mui/icons-material/Mic';

export const appDefinitions: AppDefinition[] = [
  {
    id: 'ai-editor',
    title: 'AI Editor',
    description: 'Generate code, fix bugs, and refactor your codebase with AI.',
    link: '/ai-editor',
    linkText: 'Open AI Editor',
    icon: CodeIcon,
    category: 'AI Tools',
    tags: ['AI', 'Code Generation', 'Refactoring', 'Debugging', 'Editor'],
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    description: 'Get intelligent answers and assistance for any query.',
    link: '/apps/ai-chat', // Reusing AI Chat page for now
    linkText: 'Talk to AI',
    icon: AssistantIcon,
    category: 'AI Tools',
    tags: ['AI', 'Assistant', 'Conversational AI', 'General Knowledge'],
  },
  {
    id: 'documentation-editor',
    title: 'Documentation Editor',
    description: 'Create and manage project documentation with AI assistance.',
    link: '/ai-editor?requestType=LLM_GENERATION&output=MARKDOWN', // Example: directs to AI Editor with Markdown focus
    linkText: 'Edit Docs',
    icon: TextSnippetIcon,
    category: 'Development',
    tags: ['Documentation', 'Markdown', 'AI', 'Editor', 'Content Creation'],
  },
  {
    id: 'schema-generator',
    title: 'AI Schema Generator',
    description: 'Generate and manage JSON schemas with AI assistance.',
    link: '/apps/schema-generator',
    linkText: 'Open Schema Generator',
    icon: DataObjectIcon,
    category: 'AI Tools',
    tags: ['Schema', 'JSON', 'AI', 'Forms', 'Data Modeling'],
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
    tags: ['Playwright', 'Web Automation', 'AI', 'Testing', 'Scraping'],
  },
  {
    id: 'llm-generation',
    title: 'LLM Generation (Raw)',
    description: 'Generate any code or text using LLM with raw output control.',
    link: '/apps/llm-generation',
    linkText: 'Open Generator',
    icon: AppsIcon, // Using generic AppsIcon for raw generation
    category: 'AI Tools',
    tags: ['LLM', 'Raw Generation', 'AI', 'Prototyping'],
  },
  {
    id: 'ai-chat',
    title: 'AI Chat (Legacy)',
    description:
      'Engage in a conversation with AI using the older chat interface.',
    link: '/apps/ai-chat',
    linkText: 'Open AI Chat',
    icon: ForumIcon,
    category: 'AI Tools',
    tags: ['AI', 'Chat', 'Conversation'],
  },
  {
    id: 'chat-component',
    title: 'Chat App (Direct)',
    description:
      'Direct access to the ChatApp component for testing or specific use.',
    link: '/apps/chat-component',
    linkText: 'Open Direct Chat',
    icon: ChatBubbleOutlineIcon,
    category: 'Development',
    tags: ['Chat', 'Component', 'Testing', 'Communication'],
  },
  {
    id: 'terminal',
    title: 'Terminal',
    description:
      'Access to Terminal for project automation and command execution.',
    link: '/apps/terminal',
    linkText: 'Open Terminal',
    icon: TerminalIcon,
    category: 'Development',
    tags: ['Terminal', 'CLI', 'Automation', 'Shell'],
  },
  {
    id: 'simple-git',
    title: 'Simple Git',
    description:
      'Lightweight Git interface for basic version control operations.',
    link: '/apps/simple-git',
    linkText: 'Open Simple Git',
    icon: GitHubIcon,
    category: 'Development',
    tags: ['Git', 'Version Control', 'VCS'],
  },
  {
    id: 'code-playground',
    title: 'Code Playground',
    description: 'Experiment with code snippets in an interactive environment.',
    link: '/ai-editor', // Could be another editor or a dedicated page
    linkText: 'Open Playground',
    icon: PlayCircleOutlineIcon,
    category: 'Development',
    tags: ['Code', 'Sandbox', 'Experimentation'],
  },
  {
    id: 'file-explorer',
    title: 'File Explorer',
    description: 'Browse and manage your project files with advanced features.',
    link: '/ai-editor', // Reusing AI Editor's file tree for now
    linkText: 'Explore Files',
    icon: FolderSharedIcon,
    category: 'Development',
    tags: ['Files', 'Browser', 'Management', 'Navigation'],
  },
  {
    id: 'preview',
    title: 'App Preview',
    description:
      'Preview a successfully built frontend application in an iframe.',
    link: '/apps/preview',
    linkText: 'Open Preview',
    icon: BuildIcon,
    category: 'Development',
    tags: ['Preview', 'Frontend', 'Deployment', 'Testing'],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'A central hub to manage your projects and applications.',
    link: '/dashboard',
    linkText: 'Open Dashboard',
    icon: DashboardIcon,
    category: 'Management',
    tags: ['Dashboard', 'Overview', 'Management'],
  },
  {
    id: 'organizations',
    title: 'Organizations',
    description: 'Manage your organizations and associated projects.',
    link: '/organizations',
    linkText: 'Manage Orgs',
    icon: GroupIcon,
    category: 'Management',
    tags: ['Organization', 'Projects', 'Teams'],
  },
  {
    id: 'kanban-board',
    title: 'Project Kanban Board',
    description:
      'Visualize and manage your project tasks using a Kanban board.',
    link: '/apps/kanban-board',
    linkText: 'Open Kanban Board',
    icon: AssignmentIcon,
    category: 'Management',
    tags: ['Kanban', 'Project Management', 'Tasks', 'Board'],
  },
  {
    id: 'task-manager',
    title: 'Task Manager',
    description: 'A simple app to keep track of your daily tasks and todos.',
    link: '/apps/kanban-board', // Linking to Kanban for now, could be a simpler todo list
    linkText: 'Manage Tasks',
    icon: AssignmentTurnedInIcon,
    category: 'Management',
    tags: ['Tasks', 'Todo List', 'Productivity'],
  },
  {
    id: 'media-player',
    title: 'Media Player',
    description:
      'Explore and enjoy a simulated music and video streaming experience.',
    link: '/apps/spotify',
    linkText: 'Open Media Player',
    icon: LibraryMusicIcon,
    category: 'Entertainment',
    tags: ['Music', 'Video', 'Streaming', 'Player'],
  },
  {
    id: 'recording',
    title: 'Screen Recorder',
    description: 'Record your screen activity and capture screenshots.',
    link: '/apps/recording',
    linkText: 'Open Recorder',
    icon: VideocamIcon,
    category: 'Utilities',
    tags: ['Screen Recording', 'Screenshot', 'Video Capture'],
  },
  {
    id: 'transcription',
    title: 'Transcription App',
    description: 'Transcribe audio files to text using AI.',
    link: '/apps/transcription',
    linkText: 'Open Transcription',
    icon: DescriptionIcon,
    category: 'Utilities',
    tags: ['Transcription', 'Audio to Text', 'AI'],
  },
  {
    id: 'translator',
    title: 'AI Translator',
    description: 'Translate text or files into various languages with AI.',
    link: '/apps/translator',
    linkText: 'Open Translator',
    icon: TranslateIcon,
    category: 'Utilities',
    tags: ['Translation', 'Language', 'AI'],
  },
  {
    id: 'network-monitor',
    title: 'Network Monitor',
    description: 'Monitor network activity and check connectivity.',
    link: '/apps/terminal', // Can be simulated or integrate with backend terminal
    linkText: 'Monitor Network',
    icon: NetworkCheckIcon,
    category: 'Utilities',
    tags: ['Network', 'Monitoring', 'Connectivity'],
  },
  {
    id: 'resume-builder',
    title: 'Resume Builder',
    description: 'Build and optimize your resume using AI and templates.',
    link: '/apps/resume-builder',
    linkText: 'Open Resume Builder',
    icon: AssignmentIcon,
    category: 'Productivity',
    tags: ['Resume', 'CV', 'AI', 'Job Search'],
  },
  {
    id: 'gemini-live-audio',
    title: 'Gemini Live Audio Chat',
    description: 'Engage in real-time voice conversations with Gemini AI.',
    link: '/apps/gemini-live-audio',
    linkText: 'Start Voice Chat',
    icon: MicIcon, // Assuming MicIcon is available or imported
    category: 'AI Tools',
    tags: ['Gemini', 'Voice Chat', 'AI', 'Realtime'],
  },
  {
    id: 'swingers',
    title: 'Swingers App',
    description:
      'Connect with a community of like-minded individuals for video chat.',
    link: '/apps/swingers',
    linkText: 'Open Swingers App',
    icon: GroupIcon,
    category: 'Community',
    tags: ['Community', 'Video Chat', 'Social'],
  },
  {
    id: 'profile',
    title: 'User Profile',
    description: 'View and manage your user profile and account details.',
    link: '/profile',
    linkText: 'View Profile',
    icon: AccountCircleIcon,
    category: 'User',
    tags: ['User', 'Profile', 'Account'],
  },
  {
    id: 'settings',
    title: 'User Settings',
    description: 'Configure your user settings and preferences.',
    link: '/settings',
    linkText: 'Open Settings',
    icon: SettingsIcon,
    category: 'User',
    tags: ['Settings', 'Preferences', 'Account'],
  },
];
