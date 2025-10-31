import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '~/components/Layout';
import HomePage from '~/pages/HomePage';
import { LoginPage } from '~/pages/LoginPage';
import { AuthCallback } from '~/pages/AuthCallback';
import { TtsGeneratorPage } from '~/pages/TtsGeneratorPage';
import PlannerPage from '~/apps/planner/pages/PlannerPage';

/**
 * Main application router using React Router DOM v6's createBrowserRouter.
 * Defines all routes and their respective components.
 * Routes that should include the common layout (Navbar, etc.) are nested under the <Layout /> component.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true, // This is the default child route for '/', rendering HomePage
        element: <HomePage />,
      },
      {
        path: 'tts', // Route for the TTS Generator page
        element: <TtsGeneratorPage />,
      },
      {
        path: 'planner', // Route for the AI Planner page
        element: <PlannerPage />,
      },
      // Add other routes here that should appear within the Layout
    ],
  },
  {
    path: '/login', // Login page, intentionally outside the main layout
    element: <LoginPage />,
  },
  {
    path: '/auth/callback', // OAuth callback page, intentionally outside the main layout
    element: <AuthCallback />,
  },
  // Potentially add a 404 Not Found route here if needed
  // {
  //   path: '*', 
  //   element: <NotFoundPage />,
  // },
]);
