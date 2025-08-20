import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar'; // Import the new Navbar component
import { checkAuthStatus } from '@/services/authService'; // For initial auth check
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import LinearProgress from '@mui/material/LinearProgress'; // For global loading indicator
import Box from '@mui/material/Box';

const Layout: React.FC = () => {
  const { loading: authLoading } = useStore(authStore);

  useEffect(() => {
    // Check authentication status on component mount
    // This will update the authStore's isLoggedIn and user fields
    checkAuthStatus();
  }, []); // Run only once on initial mount

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <Navbar /> {/* Render Navbar at the top */}
      {authLoading && (
        <Box sx={{ width: '100%', position: 'sticky', top: 0, zIndex: 1100 }}>
          <LinearProgress />
        </Box>
      )}
      <header className="w-full max-w-4xl mb-8 mt-8">
        {' '}
        {/* Added mt-8 for spacing below navbar */}
        <h1 className="text-4xl font-extrabold text-gray-900 text-center">Resume AI Assistant</h1>
        <p className="mt-2 text-center text-gray-600">
          Optimize, Generate, and Enhance Your Resume with AI
        </p>
      </header>
      <main className="flex-grow w-full max-w-4xl bg-white shadow-xl rounded-lg p-6 sm:p-8 mb-8">
        {' '}
        {/* Added mb-8 for footer spacing */}
        <Outlet />
      </main>
      <footer className="w-full max-w-4xl mt-auto text-center text-gray-500 text-sm py-4">
        {' '}
        {/* mt-auto pushes footer to bottom */}© 2024 Resume AI Assistant. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
