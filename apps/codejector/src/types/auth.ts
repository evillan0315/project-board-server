export interface UserProfile {
  id?: string;
  email?: string;
  name?: string;
  image?: string;
  role?: 'USER' | 'ADMIN' | 'MANAGER' | 'SUPERADMIN'; // Mirroring backend Role enum
  username?: string; // Add username for local registration/profile
  provider?: 'google' | 'github' | 'local'; // Added 'local' provider
  accessToken?: string; // Only for client-side use if needed, backend sets HTTP-only cookie
  organization?: string; // New: User's primary organization for display purposes
}

export interface AuthState {
  isLoggedIn: boolean;
  user: UserProfile | null;
  loading: boolean; // Indicates if auth status is being loaded (e.g., on app start)
  error: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string; // Changed from 'username' to 'name' to align with backend RegisterDto
}
