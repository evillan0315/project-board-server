import React from 'react';
import { Box, Button, Typography, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useState } from 'react';
import { ProjectFormDialog } from '@/pages/ProjectsPage';

const InitialEditorViewer: React.FC = () => {
  const theme = useTheme();
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);

  const handleOpenNewProjectDialog = () => {
    setIsNewProjectDialogOpen(true);
  };

  const handleCloseNewProjectDialog = () => {
    setIsNewProjectDialogOpen(false);
  };

  return (
    <Box
      className="flex flex-col items-center justify-center h-full"
      sx={{
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
      }}
    >
      <Typography variant="h4" gutterBottom>
        Welcome to the AI Editor
      </Typography>
      <Typography variant="body1" paragraph>
        Start by opening an existing file or creating a new one.
      </Typography>
      <Box className="flex gap-4">
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenNewProjectDialog}
        >
          New Project
        </Button>
      </Box>

      {/* New Project Dialog */}
      <ProjectFormDialog
        open={isNewProjectDialogOpen}
        onClose={handleCloseNewProjectDialog}
        onCreate={async () => {
          handleCloseNewProjectDialog();
        }} // Placeholder function
        isEditMode={false}
        loading={false}
        organizationId={''} // Provide a default organizationId if needed
      />
    </Box>
  );
};

export default InitialEditorViewer;
