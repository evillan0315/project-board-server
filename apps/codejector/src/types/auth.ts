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

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: IAuthUser;
}
