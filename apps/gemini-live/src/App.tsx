import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import AuthCallback from './pages/AuthCallback';
import GeminiLivePage from './pages/GeminiLivePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/gemini-live" element={<GeminiLivePage />} />
      </Route>
    </Routes>
  );
}

export default App;
