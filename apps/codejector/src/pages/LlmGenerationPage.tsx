import React from 'react';
import PageLayout from '@/components/PageLayout';
import LlmGenerationContent from '@/components/LlmGenerationContent';

const LlmGenerationPage: React.FC = () => (
  <PageLayout body={<LlmGenerationContent />} />
);

export default LlmGenerationPage;
