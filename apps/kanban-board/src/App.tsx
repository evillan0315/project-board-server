import React from 'react';
import { Container, Typography } from '@mui/material';
import KanbanBoard from './components/KanbanBoard';

function App() {
  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Kanban Board
      </Typography>
      <KanbanBoard />
    </Container>
  );
}

export default App;