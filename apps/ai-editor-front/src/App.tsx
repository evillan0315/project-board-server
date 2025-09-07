import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import AiEditorPage from './pages/AiEditorPage'; // Import AiEditorPage

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<AiEditorPage />} />{' '}
        {/* Changed to AiEditorPage */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* Add more routes here as needed */}
      </Route>
    </Routes>
  );
}

export default App;
