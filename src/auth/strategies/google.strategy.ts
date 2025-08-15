import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { GoogleProfileDto } from '../dto/google-profile.dto';
import { GoogleTokenDto } from '../dto/google-token.dto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, name, emails, photos, provider } = profile;

    // Construct typed DTOs
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
      idToken: profile.id_token, // in case it's included
      expiresAt: profile._json?.exp || null,
      scope: profile.scope || null,
      tokenType: profile.token_type || null,
    };

    done(null, { profile: profileDto, tokens: tokenDto });
  }
}
