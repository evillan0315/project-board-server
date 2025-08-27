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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <Navbar />
      {authLoading && (
        <Box sx={{ width: '100%', position: 'sticky', top: 0, zIndex: 1100 }}>
          <LinearProgress />
        </Box>
      )}
      <header className="w-full max-w-4xl mb-8 mt-8">
        <h1 className="text-4xl font-extrabold text-gray-900 text-center">Gemini Live App</h1>
        <p className="mt-2 text-center text-gray-600">Real-time AI voice and video interactions.</p>
      </header>
      <main className="flex-grow w-full max-w-4xl bg-white shadow-xl rounded-lg p-6 sm:p-8 mb-8">
        <Outlet />
      </main>
      <footer className="w-full max-w-4xl mt-auto text-center text-gray-500 text-sm py-4">
        © 2024 Gemini Live App. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
