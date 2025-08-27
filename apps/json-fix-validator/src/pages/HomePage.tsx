import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  CodeOutlined,
  DescriptionOutlined,
  DataObjectOutlined,
  TextSnippetOutlined,
  ImageOutlined,
  SettingsOutlined,
  GavelOutlined,
  CheckCircleOutline,
} from '@mui/icons-material';

interface ToolItem {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  link: string;
}

const tools: ToolItem[] = [
  {
    id: 'json-fixer',
    name: 'JSON Fixer',
    description:
      'Automatically corrects malformed or invalid JSON strings, making them parseable.',
    icon: DataObjectOutlined,
    link: '/json-fixer',
  },
  {
    id: 'json-yaml-converter',
    name: 'JSON/YAML Converter',
    description: 'Seamlessly convert between JSON and YAML data formats.',
    icon: TextSnippetOutlined,
    link: '/json-yaml-converter',
  },
  {
    id: 'base64-url-encoding',
    name: 'Base64 & URL Encoding',
    description:
      'Encode and decode strings using Base64 or URL encoding for data transfer.',
    icon: CodeOutlined,
    link: '/encoding',
  },
  {
    id: 'markdown-utilities',
    name: 'Markdown Utilities',
    description:
      'Convert Markdown to HTML, plain text, or DOCX, and extract AST or titles.',
    icon: DescriptionOutlined,
    link: '/markdown-utilities',
  },
  {
    id: 'code-formatter',
    name: 'Code Formatter',
    description:
      'Format various programming languages using Prettier for consistent code style.',
    icon: CodeOutlined,
    link: '/code-formatter',
  },
  {
    id: 'image-to-svg',
    name: 'Image to SVG Converter',
    description:
      'Convert raster images (PNG, JPG) into scalable vector graphics (SVG).',
    icon: ImageOutlined,
    link: '/image-to-svg',
  },
  {
    id: 'env-json-converter',
    name: '.ENV <-> JSON',
    description:
      'Convert .env files to JSON objects and vice versa for easy configuration management.',
    icon: SettingsOutlined,
    link: '/env-json-converter',
  },
  {
    id: 'sql-parser-generator',
    name: 'SQL Parser & Generator',
    description:
      'Parse SQL SELECT/INSERT statements to JSON or generate INSERT statements from JSON.',
    icon: GavelOutlined,
    link: '/sql-utilities',
  },
  {
    id: 'jsdoc-to-markdown',
    name: 'JSDoc to Markdown',
    description:
      'Generate comprehensive Markdown documentation directly from JSDoc comments.',
    icon: DescriptionOutlined,
    link: '/jsdoc-to-markdown',
  },
];

const features = [
  {
    title: 'Type-Safe Utilities',
    description:
      'All tools are built with robust TypeScript, ensuring reliability.',
  },
  {
    title: 'Dark Mode Ready',
    description:
      'Enjoy a comfortable viewing experience with a default dark theme.',
  },
  {
    title: 'Intuitive UI/UX',
    description:
      'Designed for ease of use, making complex tasks simple and quick.',
  },
  {
    title: 'Modular & Extensible',
    description:
      'A flexible architecture allows for easy addition of new tools and features.',
  },
];

const HomePage: React.FC = () => {
  return (
    <Box className="min-h-screen flex flex-col items-center py-10">
      <Container maxWidth="lg" className="text-center space-y-12 px-4">
        {/* Hero Section */}
        <Box className="py-20">
          <Typography
            variant="h2"
            component="h1"
            className="font-extrabold mb-4 text-4xl sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 dark:from-blue-300 dark:to-purple-500"
          >
            Your Ultimate Dev Utility Belt
          </Typography>
          <Typography
            variant="h5"
            component="p"
            className="mb-20 py-4"
          >
            A comprehensive collection of developer tools to streamline your
            workflow, from JSON manipulation to code formatting and document
            conversion.
          </Typography>
          <Button
            component={Link}
            to="/json-fixer"
            variant="contained"
            size="large"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all transform hover:scale-105"
            sx={{ '&.MuiButton-root': { backgroundColor: 'transparent' } }} // Override default MUI background
          >
            Get Started
          </Button>
        </Box>

        {/* Features Section */}
        <Box className="py-12">
          <Typography
            variant="h4"
            component="h2"
            className="font-bold mb-10"
          >
            Key Features
          </Typography>
          <Grid container spacing={4} alignItem={"center"} justifyContent="between">
            {features.map((feature, index) => (
              <Grid item xs={12} sm={4} md={3} key={index}>
                <Card className="h-full p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="flex flex-col items-center text-center">
                    <CheckCircleOutline
                      className="text-blue-500 dark:text-blue-400 mb-4"
                      style={{ fontSize: '3rem' }}
                    />
                    <Typography
                      variant="h6"
                      component="h3"
                      className="font-semibold mb-2"
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      className="text-muted"
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Tools Utilities Section */}
        <Box className="py-12">
          <Typography
            variant="h4"
            component="h2"
            className="font-bold mb-10 text-gray-800 dark:text-gray-100"
          >
            Explore Our Utilities
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {tools.map((tool) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={tool.id}>
                <ToolCard tool={tool} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

interface ToolCardProps {
  tool: ToolItem;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const IconComponent = tool.icon;
  return (
    <Card className="h-full flex flex-col rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
      <CardContent className="flex-grow flex flex-col items-center text-center p-6">
        <IconComponent
          className="text-blue-500 dark:text-blue-400 mb-4"
          style={{ fontSize: '3rem' }}
        />
        <Typography
          variant="h6"
          component="h3"
          className="font-semibold mb-2 text-gray-800 dark:text-gray-100"
        >
          {tool.name}
        </Typography>
        <Typography
          variant="body2"
          className="text-gray-600 dark:text-gray-300 flex-grow mb-4"
        >
          {tool.description}
        </Typography>
        <Button
          component={Link}
          to={tool.link}
          variant="outlined"
          color="primary"
          className="mt-auto text-blue-500 dark:text-blue-400 border-blue-500 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700"
        >
          Use Tool
        </Button>
      </CardContent>
    </Card>
  );
};

export default HomePage;
