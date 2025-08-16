// src/auth/strategies/github.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-github2';
import { GitHubProfileDto, GitHubTokenDto } from '../dto/github-profile.dto';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, login, displayName, emails, photos, provider } = profile;

    // Construct typed DTOs
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
  }
}
