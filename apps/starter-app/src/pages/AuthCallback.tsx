import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginSuccess, setError } from '@/stores/authStore';
import Loading from '@/components/Loading';

import type { UserProfile } from '@/types/auth';

const AuthCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('accessToken');
    const userId = params.get('userId');
    const userEmail = params.get('userEmail');

    if (token && userId && userEmail) {
      const userData: UserProfile = {
        id: userId as string,
        email: userEmail as string,
        name: params.get('userName') || undefined,
        image: params.get('userImage') || undefined,
        role: (params.get('userRole') as UserProfile['role']) || 'USER',
        username: params.get('username') || undefined,
        provider: (params.get('provider') as UserProfile['provider']) || undefined,
        accessToken: token,
      };

      try {
        loginSuccess(userData, token);
        navigate('/', { replace: true });
      } catch (error) {
        console.error('Failed to process auth callback:', error);
        setError('Authentication failed. Please try again.');
        navigate('/login?error=auth_failed', { replace: true });
      }
    } else {
      console.error('AuthCallback: No access token, userId, or userEmail found in URL.');
      setError('Authentication failed: Missing required parameters.');
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
