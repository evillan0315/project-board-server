import React from 'react';
import {
  Box,
  Typography,
  Container,
  Button,
  useTheme,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import { Link } from 'react-router-dom';
import TerminalIcon from '@mui/icons-material/Terminal';
import DashboardIcon from '@mui/icons-material/Dashboard'; // Keeping this icon, but text changed
import AppsIcon from '@mui/icons-material/Apps';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // For AI generation
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'; // For diff/changes
import FolderOpenIcon from '@mui/icons-material/FolderOpenOutlined'; // For file tree
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // For file upload
import EditNoteIcon from '@mui/icons-material/EditNote'; // For instructions
import { APP_NAME, APP_DESCRIPTION } from '@/constants/app'; // Import APP_NAME and APP_DESCRIPTION from app.ts

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  link?: string;
  linkText?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon: Icon,
  link,
  linkText,
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[6],
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Icon
            sx={{ fontSize: 40, color: theme.palette.primary.main, mr: 2 }}
          />
          <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
      {link && linkText && (
        <CardActions sx={{ mt: 'auto', p: 2 }}>
          <Button size="small" component={Link} to={link} variant="outlined">
            {linkText}
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

const HomePage: React.FC = () => {
  const theme = useTheme();

  const features = [
    {
      title: 'AI-Powered Code Generation',
      description:
        'Generate new files, modify existing ones, and repair code with intelligent AI assistance.',
      icon: AutoAwesomeIcon,
      link: '/ai-editor',
      linkText: 'Start Building',
    },
    {
      title: 'Interactive Proposed Changes',
      description:
        'Review AI-generated file changes, view detailed git diffs, and edit content before applying.',
      icon: CompareArrowsIcon,
      link: '/editor',
      linkText: 'Explore Editor',
    },
    {
      title: 'Project File Navigation',
      description:
        'Browse your project structure with an interactive file tree and view file content.',
      icon: FolderOpenIcon,
      link: '/editor',
      linkText: 'Browse Files',
    },
    {
      title: 'Multi-Modal AI Input',
      description:
        'Upload files or paste Base64 image data to provide rich context to the AI.',
      icon: CloudUploadIcon,
      link: '/editor',
      linkText: 'Provide Context',
    },
    {
      title: 'Customizable AI Instructions',
      description:
        'Fine-tune AI behavior by modifying system instructions and expected output formats.',
      icon: EditNoteIcon,
      link: '/editor',
      linkText: 'Configure AI',
    },
    {
      title: 'Direct Terminal Execution',
      description:
        'Execute AI-generated Git commands and other terminal scripts directly from the UI.',
      icon: TerminalIcon,
      link: '/editor',
      linkText: 'Run Commands',
    },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: 'calc(100vh - 120px)', // Adjust based on Navbar/Footer height
        textAlign: 'center',
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        py: 8,
        flexGrow: 1, // Allow this box to grow and fill available space
      }}
    >
      <Container maxWidth="md">
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 700, mb: 3 }}
          className="!text-4xl sm:!text-5xl md:!text-6xl"
        >
          {APP_NAME}
        </Typography>
        <Typography
          variant="h5"
          component="p"
          sx={{ mb: 5, color: theme.palette.text.secondary }}
          className="!text-lg sm:!text-xl md:!text-2xl"
        >
          {APP_DESCRIPTION}
        </Typography>
        <Box
          sx={{
            mt: 4,
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Button
            variant="contained"
            color="primary"
            size="large"
            component={Link}
            to="/ai-editor"
            startIcon={<TerminalIcon />}
            sx={{ py: 1.5, px: 3, fontSize: '1.1rem' }}
          >
            Start Coding
          </Button>
          {/* Changed Dashboard to Organizations, matching Navbar changes */}
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            component={Link}
            to="/organizations"
            startIcon={<DashboardIcon />}
            sx={{ py: 1.5, px: 3, fontSize: '1.1rem' }}
          >
            Manage Organizations
          </Button>
          <Button
            variant="outlined"
            color="info"
            size="large"
            component={Link}
            to="/apps"
            startIcon={<AppsIcon />}
            sx={{ py: 1.5, px: 3, fontSize: '1.1rem' }}
          >
            Explore Apps
          </Button>
        </Box>
      </Container>

      <Container maxWidth="lg" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 6 }}>
          Key Features
        </Typography>
        {/* Use Tailwind CSS grid for responsiveness */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <div key={index}>
              <FeatureCard {...feature} />
            </div>
          ))}
        </div>
      </Container>
    </Box>
  );
};

export default HomePage;
