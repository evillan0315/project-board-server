/**
 * Represents credentials for email/password login.
 */
export interface LoginCredentials {
  email: string;
  password: string; // Changed from passwordHash to password
}

/**
 * Represents the profile of an authenticated user.
 */
export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

/**
 * Represents the response received after a successful login or token validation.
 */
export interface AuthResponse {
  token: string;
  user: UserProfile;
}
