import React, { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { loginSuccess, setError } from '@/stores/authStore'; // Removed authStore import
import Loading from '@/components/Loading';
import { UserProfile } from '@/types/auth';
import { checkAuthStatus } from '@/services/authService'; // Import checkAuthStatus

const AuthCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const err = params.get('error');

    if (err) {
      console.error('AuthCallback Error:', err);
      setError(decodeURIComponent(err));
      navigate('/login', { replace: true });
      return;
    }

    // If no error, we assume a successful OAuth flow completed on the backend
    // and an httpOnly cookie has been set. We now use checkAuthStatus to retrieve user details.
    const userId = params.get('userId');
    const userEmail = params.get('userEmail');
    const userName = params.get('userName');
    const userImage = params.get('userImage');
    const userRole = params.get('userRole');
    const username = params.get('username');
    const provider = params.get('provider');
    const accessToken = params.get('accessToken');
    if (userId && userEmail && accessToken) {
      const userData: UserProfile = {
        id: userId,
        email: userEmail,
        name: userName ? decodeURIComponent(userName) : undefined,
        image: userImage ? decodeURIComponent(userImage) : undefined,
        role: (userRole as UserProfile['role']) || 'USER',
        username: username ? decodeURIComponent(username) : undefined,
        provider: (provider as UserProfile['provider']) || undefined,
      };

      // Temporarily set user data; actual auth status will be confirmed by checkAuthStatus
      loginSuccess(userData, accessToken);
      // Now, redirect to a protected route or home and let the Layout's checkAuthStatus confirm.
      navigate('/gemini-live', { replace: true });
    } else {
      console.error('AuthCallback: No user data found in URL parameters after redirect.');
      setError('Authentication failed: Missing user information.');
      navigate('/login', { replace: true });
    }
  }, [location, navigate, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <Loading />
      <p className="ml-4 text-lg">Processing authentication...</p>
    </div>
  );
};

export default AuthCallback;
