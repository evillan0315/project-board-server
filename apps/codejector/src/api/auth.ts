import {
  loginSuccess,
  logout,
  setLoading,
  setError,
  getToken,
} from '@/stores/authStore';
import { API_BASE_URL, ApiError, handleResponse, fetchWithAuth } from '@/api';
import {
  UserProfile,
  LoginRequest,
  RegisterRequest,
  IForgotPasswordRequest,
  IForgotPasswordResponse,
  IResetPasswordRequest,
  IResetPasswordResponse,
} from '@/types/auth';

export interface LoginLocalResponse {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
}
export interface RegisterLocalResponse {
  access_token: string;
  user: UserProfile;
}

export interface LogoutResponse {
  message: string;
}
export interface CheckAuthResponse {
  id: string;
  email: string;
  username: string | null;
  emailVerified: string;
  image: string;
  name: string;
  phone_number: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  role: 'ADMIN' | 'USER' | 'MANAGER' | 'DEVELOPER';
  passwordResetToken: string | null;
  passwordResetExpiresAt: string | null;
}
/**
 * Handles logging out the user by calling the backend logout endpoint.
 * Clears local auth state.
 */
export const handleLogout = async (): Promise<LogoutResponse> => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
    });
    logout();
    return handleResponse<LogoutResponse>(response);
  } catch (error: ApiError) {
    setError(error.message || 'An unknown error occurred during logout.');
  } finally {
    setLoading(false);
  }
};

/**
 * Checks the current authentication status by calling the backend '/me' endpoint.
 * Updates the auth store based on the response.
 */
export const checkAuthStatus = async (): Promise<CheckAuthResponse> => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
    });
    const authData = await handleResponse<CheckAuthResponse>(response);
    if (authData && getToken()) {
      // The user property is directly on authData, not authData.user
      // This needs a careful check if backend /me endpoint returns user data directly at root
      // Assuming `authData` IS the user profile as per CheckAuthResponse type
      loginSuccess(authData, getToken());
    }
    return authData;
  } catch (error: any) {
    console.error('Failed to check authentication', error);
    setError(error.message || 'You are not logged in. Please login.');
    throw error; // Re-throw to be caught by higher-level components if needed
  } finally {
    setLoading(false);
  }
};

/**
 * Handles local email/password login.
 * @param credentials User's email and password.
 */
export const loginLocal = async (
  credentials: LoginRequest,
): Promise<LoginLocalResponse> => {
  setLoading(true);
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    const authData = await handleResponse<LoginLocalResponse>(response);
    if (authData && authData.access_token) {
      loginSuccess(authData.user, authData.access_token);
    }
    return authData;
  } catch (error: ApiError) {
    console.error('Failed to authenticate:', error);
    setError(
      error.message || 'An unknown error message occurred during login.',
    );
    throw error; // Re-throw to be caught by the component
  } finally {
    setLoading(false);
  }
};

/**
 * Handles local email/password registration.
 * @param userData User's registration data (email, password, username).
 */
export const registerLocal = async (
  userData: RegisterRequest,
): Promise<RegisterLocalResponse> => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    const authData = await handleResponse<RegisterLocalResponse>(response);
    if (authData && authData.access_token) {
      loginSuccess(authData.user, authData.access_token);
    }
    return authData;
  } catch (error: ApiError) {
    console.error('Registration failed', error);
    setError(
      error.message || 'An unknown error message occurred during registration.',
    );
    throw error; // Re-throw to be caught by the component
  } finally {
    setLoading(false);
  }
};

/**
 * Handles requesting a password reset link.
 * @param email The email address for the password reset.
 */
export const requestPasswordReset = async (
  email: string,
): Promise<IForgotPasswordResponse> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/auth/forgot-password`,
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      },
    );
    return handleResponse<IForgotPasswordResponse>(response);
  } catch (error: ApiError) {
    console.error('Forgot password request failed', error);
    throw error; // Re-throw to be caught by the component
  }
};

/**
 * Handles password reset request.
 * @param token The reset token received via email.
 * @param newPassword The new password.
 */
export const resetPassword = async (
  token: string,
  newPassword: string,
): Promise<IResetPasswordResponse> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/auth/reset-password`,
      {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      },
    );
    return handleResponse<IResetPasswordResponse>(response);
  } catch (error: ApiError) {
    console.error('Password reset failed', error);
    throw error; // Re-throw to be caught by the component
  }
};
