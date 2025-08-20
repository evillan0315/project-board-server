export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: 'USER' | 'ADMIN' | 'MANAGER' | 'SUPERADMIN'; // Mirroring backend Role enum
  username?: string;
  provider?: 'google' | 'github';
  accessToken?: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  user: UserProfile | null;
  loading: boolean; // Indicates if auth status is being loaded (e.g., on app start)
  error: string | null;
}
