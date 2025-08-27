import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ResumeGeneratorPage from './pages/ResumeGeneratorPage';
import LoginPage from './pages/LoginPage'; // Import LoginPage

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ResumeGeneratorPage />} />
        <Route path="/login" element={<LoginPage />} /> {/* Add login route */}
        <Route path="/auth/callback" element={<LoginPage />} /> 
        {/* Add more routes here as needed */}
      </Route>
    </Routes>
  );
}

export default App;
