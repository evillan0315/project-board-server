import CodeIcon from '@mui/icons-material/Code';
import TranslateIcon from '@mui/icons-material/Translate';
import MicIcon from '@mui/icons-material/Mic'; // New icon for Gemini Live Audio
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite'; // Icon for Spotify-like app
import PreviewIcon from '@mui/icons-material/Preview'; // Icon for Preview Built App
import CorporateFareIcon from '@mui/icons-material/CorporateFare'; // Icon for Organizations
// Icon for Projects
import TranscribeIcon from '@mui/icons-material/Transcribe'; // NEW: Icon for Transcription

import { AppDefinition } from '@/types'; // Ensure this import is correct

export const appDefinitions: AppDefinition[] = [
  {
    id: 'ai-code-editor',
    title: 'AI Code Editor',
    description: 'Generate, modify, and manage code with AI assistance.',
    icon: CodeIcon,
    link: '/editor',
    linkText: 'Open Editor',
    category: 'AI Tools',
  },
  {
    id: 'ai-translator',
    title: 'AI Translator',
    description: 'Translate text or files into any language.',
    icon: TranslateIcon,
    link: '/apps/translator',
    linkText: 'Open Translator',
    category: 'AI Tools',
  },
  {
    id: 'gemini-live-audio',
    title: 'Gemini Live Audio',
    description: 'Interact with Gemini AI using real-time audio.',
    icon: MicIcon,
    link: '/apps/gemini-live-audio',
    linkText: 'Start Chat',
    category: 'AI Tools',
  },
  {
    id: 'music-player',
    title: 'Music Player',
    description: 'A Spotify-like music and video player.',
    icon: PlayCircleFilledWhiteIcon,
    link: '/apps/spotify',
    linkText: 'Open Player',
    category: 'Entertainment',
  },
  {
    id: 'preview-app',
    title: 'Preview Built App',
    description: 'Preview a built frontend application.',
    icon: PreviewIcon,
    link: '/apps/preview',
    linkText: 'Open Preview',
    category: 'Development',
  },
  {
    id: 'project-management',
    title: 'Organizations & Projects',
    description: 'Manage your organizations and projects.',
    icon: CorporateFareIcon,
    link: '/organizations',
    linkText: 'Go to Management',
    category: 'Management',
  },
  // NEW: Audio Transcription App
  {
    id: 'audio-transcription',
    title: 'Audio Transcription',
    description: 'Transcribe audio files into text with AI.',
    icon: TranscribeIcon, // Use TranscribeIcon
    link: '/apps/transcription',
    linkText: 'Open Transcriber',
    category: 'Utilities',
  },
];
