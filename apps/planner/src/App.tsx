import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { Navbar } from '@/components/Navbar';
import { LoginPage } from '@/components/auth/LoginPage';
import { AuthCallback } from '@/components/auth/AuthCallback';
import { useAuth } from '@/components/auth/hooks/useAuth';
const HomePage: React.FC = () => {
  const { user } = useAuth();
  return (
    <Box className="flex flex-col items-center justify-center min-h-[calc(100vh-128px)] p-6">
      <Typography variant="h4" component="h1" gutterBottom className="text-center text-primary-dark">
        Welcome to Starter App!
      </Typography>
      {user ? (
        <Typography variant="h6" component="p" className="text-center text-secondary-main">
          Hello, {user.firstName || user.email}! You are logged in.
        </Typography>
      ) : (
        <Typography variant="h6" component="p" className="text-center text-secondary-main">
          Please log in to continue.
        </Typography>
      )}
      {/* Add more content for your home page here */}
    </Box>
  );
};
const App: React.FC = () => {
  const { isLoggedIn, loading } = useAuth();
  // Optionally show a global loading indicator while auth state is being determined
  if (loading) {
     return (
       <Box className="flex items-center justify-center min-h-screen">
         <CircularProgress />
       </Box>
     );
  }
  return (
    <Box className="bg-background-default min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* Protected Route Example */}
        <Route
          path="/"
          element={isLoggedIn ? <HomePage /> : <LoginPage />}
        />
        {/* Add more routes here, perhaps a /dashboard that requires login */}
        {/* Example of a truly protected route that redirects if not logged in */}
        {/* <Route
          path="/dashboard"
          element={isLoggedIn ? <DashboardPage /> : <Navigate to="/login" replace />}
        /> */}
      </Routes>
    </Box>
  );
};
export default App;
