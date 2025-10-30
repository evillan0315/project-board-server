import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import HomePage from '@/pages/HomePage';
import PlannerPage from '@/pages/PlannerPage';
import LoginPage from '@/pages/LoginPage';
import AuthCallback from '@/pages/AuthCallback';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useStore(authStore);
  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }
  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path='/' element={<HomePage />} />
      <Route path='/login' element={<LoginPage />} />
      <Route path='/auth/callback' element={<AuthCallback />} />
      <Route
        path='/planner'
        element={
          <ProtectedRoute>
            <PlannerPage />
          </ProtectedRoute>
        }
      />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
};
