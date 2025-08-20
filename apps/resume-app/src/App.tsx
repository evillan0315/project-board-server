import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ResumeGeneratorPage from './pages/ResumeGeneratorPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ResumeGeneratorPage />} />
        {/* Add more routes here as needed */}
      </Route>
    </Routes>
  );
}

export default App;
