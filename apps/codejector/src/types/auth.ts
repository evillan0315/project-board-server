import { GitUser } from './git';

export enum Provider {
  GOOGLE = 'google',
  GITHUB = 'github',
  LOCAL = 'local',
}

export interface IAuthUser {
  id: string;
  email: string;
  username: string;
  profileImage: string | null;
  pictureFull?: string; // Optional full picture URL, derived from profileImage or external source
  provider: Provider;
  githubId?: string;
  googleId?: string;
  createdAt: string;
  updatedAt: string;
  roles: string[];
  accessToken: string;
  refreshToken: string;
  githubAuth?: { id: string; username: string }[];
  gender1?: string;
  gender2?: string;
  gitHubUser?: GitUser; // New field for GitHub user details
}

export interface AuthState {
  isLoggedIn: boolean;
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  name?: string;
  image?: string;
  phone_number?: string;
  role: string;
  provider?: string;
  createdAt?: string;
  updatedAt?: string;
  emailVerified?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpiresAt?: Date | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  phone_number?: string;
}

export interface IForgotPasswordRequest {
  email: string;
}

export interface IForgotPasswordResponse {
  message: string;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: IAuthUser;
}

export interface IResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface IResetPasswordResponse {
  message: string;
}
