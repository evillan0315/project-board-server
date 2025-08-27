import React, { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { authStore, loginSuccess, setError } from '@/stores/authStore';
import Loading  from '@/components/Loading';

import type { UserProfile } from '@/types/auth';
//import Loading from '@/components/Loading'; // Assuming a Loading component exists

const AuthCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('accessToken');
    if (token) {
      const userData: UserProfile = {
        id: params.get('userId') || undefined,
        email: params.get('userEmail') || undefined,
        name: params.get('userName') || undefined,
        image: params.get('userImage') || undefined,
        role: params.get('userRole') || undefined,
        username: params.get('username') || undefined,
        provider: params.get('provider') || undefined,
      };

      try {
        loginSuccess(userData, token);
        navigate('/', { replace: true });
      } catch (error) {
        console.error('Failed to process auth callback:', error);
        // Optionally redirect to login with an error message
        //navigate('/login?error=auth_failed', { replace: true });
      }
    } else {
      console.error('AuthCallback: No access token found in URL.');
      navigate('/login?error=no_token', { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <Loading />
      <p className="ml-4 text-lg">Processing authentication...</p>
    </div>
  );
};

export default AuthCallback;
