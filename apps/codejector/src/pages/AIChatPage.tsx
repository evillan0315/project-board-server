import React from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  useTheme,
  Grid,
  Card,
  CardContent,
  Button,
  CardActions,
} from '@mui/material';
import PageLayout from '@/components/layouts/PageLayout';
import AiPromptGeneratorBody from '@/components/ai-tools/AiPromptGeneratorBody';
import AiPromptGeneratorHeader from '@/components/ai-tools/AiPromptGeneratorHeader';
import AIPromptGenerator from '@/components/ai-tools/AIPromptGenerator';
const AIChatPage: React.FC = () => {
  const theme = useTheme();
  return (
    <PageLayout
      header={<AiPromptGeneratorHeader />}
      body={<AiPromptGeneratorBody />} // Implemented in body
      footer={<AIPromptGenerator />}
      bodyPosition={'top'}
      centerBodyPostition={false}
    />
  );
};

export default AIChatPage;
