import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SetupPage } from './pages/SetupPage';
import { Box } from '@mui/material';

function App() {
  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Router>
        <Routes>
          <Route path="/" element={<SetupPage />} />
          {/* Add more routes here as needed */}
        </Routes>
      </Router>
    </Box>
  );
}

export default App;
