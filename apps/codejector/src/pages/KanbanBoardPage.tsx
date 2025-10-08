import React from 'react';
import { Container, Typography } from '@mui/material';
import { KanbanBoard } from '@/components/board';

const KanbanBoardPage: React.FC = () => (
  <Container maxWidth="lg" sx={{ mt: 4 }}>
    <Typography variant="h4" component="h1" gutterBottom>
      Project Management Board
    </Typography>
    <KanbanBoard />
  </Container>
);

export default KanbanBoardPage;
