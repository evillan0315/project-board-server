import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class GoogleOAuthService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI, // Required if doing full OAuth flow
    );

    // Optionally set refresh token if you have one
    this.oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });
  }

  /**
   * Retrieves a valid access token, refreshing it if necessary.
   */
  async getAccessToken(): Promise<string> {
    try {
      const tokenResponse = await this.oauth2Client.getAccessToken();
      if (!tokenResponse.token) {
        throw new Error('Failed to retrieve access token');
      }
      return tokenResponse.token;
    } catch (error) {
      throw new HttpException(
        `Failed to get Google OAuth access token: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
