export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: 'USER' | 'ADMIN' | 'MANAGER' | 'SUPERADMIN'; // Mirroring backend Role enum
  username?: string;
  provider?: 'google' | 'github';
  // accessToken is no longer stored on the frontend for HTTP-only cookie based auth
}

export interface AuthState {
  // token: string; // Removed, as token is managed by httpOnly cookies on the backend
  isLoggedIn: boolean;
  user: UserProfile | null;
  loading: boolean; // Indicates if auth status is being loaded (e.g., on app start)
  error: string | null;
}
