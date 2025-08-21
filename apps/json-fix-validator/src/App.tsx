import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import JsonFixerPage from './pages/JsonFixerPage';
import LoginPage from './pages/LoginPage'; // Import LoginPage

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<JsonFixerPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<LoginPage />} />
        {/* Add more routes here as needed */}
      </Route>
    </Routes>
  );
}

export default App;
