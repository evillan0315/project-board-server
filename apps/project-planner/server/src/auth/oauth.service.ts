import { PrismaService, Role } from '../prisma/prisma.service';
import { CustomError } from '../common/errors';

import {
  GoogleProfileDto,
  GoogleTokenDto,
  GitHubProfileDto,
  GitHubTokenDto,
  OAuthProfile,
  OAuthTokens,
} from './types';

type Provider = 'google' | 'github';

export class OAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(
    provider: Provider,
    profile: GoogleProfileDto | GitHubProfileDto,
    tokens: GoogleTokenDto | GitHubTokenDto,
  ) {
    const normalized = this.normalizeProfile(provider, profile);
    return this.handleOAuthLogin(provider, normalized, tokens);
  }

  private normalizeProfile(
    provider: Provider,
    profile: GoogleProfileDto | GitHubProfileDto,
  ): OAuthProfile {
    if (provider === 'google') {
      const google = profile as GoogleProfileDto;
      const email = google.emails?.[0]?.value;
      const image = google.photos?.[0]?.value;
      const name = (
        `${google.name?.givenName ?? ''} ${google.name?.familyName ?? ''}`
      ).trim();

      if (!email) {
        throw new CustomError(
          'Google profile does not contain a valid email address.',
          400,
        );
      }

      return {
        id: google.id,
        email,
        name,
        image,
      };
    }

    const github = profile as GitHubProfileDto;
    if (!github.email) {
      throw new CustomError(
        'GitHub profile does not contain a valid email address.',
        400,
      );
    }

    return {
      id: github.id,
      email: github.email,
      name: github.name,
      image: github.avatar_url,
      login: github.login,
    };
  }

  private async handleOAuthLogin(
    provider: Provider,
    profile: OAuthProfile,
    tokens: OAuthTokens,
  ) {
    const { id: providerAccountId, email, name, image, login } = profile;

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: name || undefined,
          image: image || undefined,
          emailVerified: new Date(),
          role: Role.USER,
        },
      });
    } else if (!user.image && image) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { image, username: login },
      });
    } else if (!user.username && login) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { username: login },
      });
    }

    await this.prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      update: {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        id_token: tokens.idToken,
        expires_at: tokens.expiresAt,
        scope: tokens.scope,
        token_type: tokens.tokenType,
      },
      create: {
        provider,
        providerAccountId,
        type: 'oauth',
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        id_token: tokens.idToken,
        expires_at: tokens.expiresAt,
        scope: tokens.scope,
        token_type: tokens.tokenType,
        createdBy: { connect: { id: user.id } },
      },
    });

    return user;
  }
}
