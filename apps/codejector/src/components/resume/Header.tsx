import React from 'react';
import { Box, Container, Button, Typography } from '@mui/material';
import AppsIcon from '@mui/icons-material/Apps';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';

const Header = () => (
  <Box
    component="header"
    sx={{ bgcolor: 'background.paper', py: 2, px: 3, boxShadow: 1 }}
  >
    <Container
      maxWidth="lg"
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mx: 'auto',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            bgcolor: 'primary.main',
            width: 40,
            height: 40,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppsIcon sx={{ color: 'white' }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          ResumeForge
          <Typography component="span" color="primary">
            Pro
          </Typography>
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button variant="contained" color="primary" startIcon={<SaveIcon />}>
          Save
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<DownloadIcon />}
        >
          Export PDF
        </Button>
      </Box>
    </Container>
  </Box>
);

export default Header;
