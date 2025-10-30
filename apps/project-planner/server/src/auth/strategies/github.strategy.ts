import { Strategy as GitHubStrategy, VerifyCallback } from 'passport-github2';
import { GitHubProfileDto, GitHubTokenDto } from '../types';
import { ConfigService } from '../../src/config';

const configService = new ConfigService();

export const githubStrategy = new GitHubStrategy(
  {
    clientID: configService.get('GITHUB_CLIENT_ID'),
    clientSecret: configService.get('GITHUB_CLIENT_SECRET'),
    callbackURL: configService.get('GITHUB_CALLBACK_URL'),
    scope: ['user:email'],
    passReqToCallback: true,
  },
  async (
    request: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> => {
    const { id, login, displayName, emails, photos, provider } = profile;

    const profileDto: GitHubProfileDto = {
      id,
      login,
      name: displayName,
      provider,
      email: emails?.[0]?.value,
      avatar_url: photos?.[0]?.value,
    };

    const tokenDto: GitHubTokenDto = {
      accessToken,
      refreshToken,
      scope: profile._scope || null,
      tokenType: profile._tokenType || null,
    };

    done(null, { profile: profileDto, tokens: tokenDto });
  },
);
