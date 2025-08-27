import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import HomePage from './pages/HomePage'; // Import HomePage

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} /> {/* Changed to HomePage */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* Add more routes here as needed */}
      </Route>
    </Routes>
  );
}

export default App;
