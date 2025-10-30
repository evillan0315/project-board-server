import { Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth20';
import { GoogleProfileDto, GoogleTokenDto } from '../types';
import { ConfigService } from '../../src/config';

const configService = new ConfigService();

export const googleStrategy = new GoogleStrategy(
  {
    clientID: configService.get('GOOGLE_CLIENT_ID'),
    clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
    callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
    scope: ['email', 'profile'],
    passReqToCallback: true,
  },
  async (
    request: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> => {
    const { id, name, emails, photos, provider } = profile;

    const profileDto: GoogleProfileDto = {
      id,
      displayName: profile.displayName,
      provider,
      name: {
        familyName: name.familyName,
        givenName: name.givenName,
      },
      emails: emails?.map((e: any) => ({ value: e.value })) || [],
      photos: photos?.map((p: any) => ({ value: p.value })) || [],
    };

    const tokenDto: GoogleTokenDto = {
      accessToken,
      refreshToken,
      idToken: profile.id_token,
      expiresAt: profile._json?.exp || null,
      scope: profile.scope || null,
      tokenType: profile.token_type || null,
    };

    done(null, { profile: profileDto, tokens: tokenDto });
  },
);
