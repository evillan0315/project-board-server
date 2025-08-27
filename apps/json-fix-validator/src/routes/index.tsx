import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import CircularProgress from '@/components/ui/CircularProgress';
import Layout from '@/components/Layout'; // Import the Layout component

// Lazy-loaded page components
const HomePage = lazy(() => import('@/pages/HomePage'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const JsonFixerPage = lazy(() => import('@/pages/JsonFixerPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const JsonToYamlPage = lazy(() => import('@/pages/utils/json-yaml/JsonToYamlPage'));

const router = createBrowserRouter([
  {
    // This is the main layout route. It will render the Layout component
    // and then render its children into the Layout's <Outlet />.
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/json-fixer',
        element: <JsonFixerPage />,
      },
      {
        path: '/json-yaml-converter',
        element: <JsonToYamlPage />,
      },
      // Add more routes here that should use the common Layout
    ],
  },
  // Routes that should NOT use the Layout (e.g., login, auth callbacks, 404 pages)
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/auth/callbaack', 
    element: <AuthCallback />,
  },
  {
    path: '*', // Catch-all for 404 pages
    element: (
      <div className="flex justify-center items-center h-screen dark:bg-gray-900 dark:text-gray-100">
        404 - Page Not Found
      </div>
    ),
  },
]);

const AppRoutes: React.FC = () => (
  <Suspense
    fallback={
      <div className="flex justify-center items-center h-screen">
        <CircularProgress />
      </div>
    }
  >
    <RouterProvider router={router} />
  </Suspense>
);

export default AppRoutes;
