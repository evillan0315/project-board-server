import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { checkAuthStatus } from '@/services/authService';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';

const Layout: React.FC = () => {
  const { loading: authLoading } = useStore(authStore);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center transition-colors duration-300">
      <Navbar />
      {authLoading && (
        <Box sx={{ width: '100%', position: 'sticky', top: 0, zIndex: 1100 }}>
          <LinearProgress />
        </Box>
      )}
      {/* Header content moved to Navbar.tsx */}
      <main className="flex-grow w-full max-w-7xl bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 sm:p-8 mb-8 mt-8 transition-colors duration-300">
        <Outlet />
      </main>
      <footer className="w-full max-w-4xl mt-auto text-center text-gray-500 dark:text-gray-400 text-sm py-4 transition-colors duration-300">
        © 2024 Resume AI Assistant. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
