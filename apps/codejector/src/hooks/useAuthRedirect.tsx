// src/hooks/useAuthRedirect.tsx
import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

export function useAuthRedirect(loginPath = '/login') {
  const { isLoggedIn, loading } = useStore(authStore);
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect after the initial loading phase is finished
    if (!loading && !isLoggedIn) {
      navigate(loginPath);
    }
  }, [loading, isLoggedIn, navigate, loginPath]);
}
