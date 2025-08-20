import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ResumeGeneratorPage from './pages/ResumeGeneratorPage';
import './App.css'; // You might want to remove or customize this later

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <header className="bg-blue-600 dark:bg-blue-800 p-4 text-white shadow-md">
          <h1 className="text-2xl font-bold">Resume Generator & Optimizer</h1>
        </header>
        <main className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<ResumeGeneratorPage />} />
            {/* Add more routes here if needed */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
