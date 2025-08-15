import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractFromCookieOrHeader,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  /**
   * Extract JWT from cookies or Authorization header if present (optional).
   */
  private static extractFromCookieOrHeader(req: any): string | null {
    // HTTP Cookies
    if (req?.cookies?.accessToken) {
      return req.cookies.accessToken;
    }

    // WebSocket Cookies
    const cookieHeader = req?.handshake?.headers?.cookie;
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map((cookie) => {
          const [key, value] = cookie.trim().split('=');
          return [key, decodeURIComponent(value)];
        }),
      );
      if (cookies['accessToken']) {
        return cookies['accessToken'];
      }
    }

    // Optional Bearer header (HTTP only)
    const authHeader = req?.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }

    return null;
  }

  async validate(req: Request, payload: any) {
    const user = await this.authService.validateUser(payload.sub);
    return user ?? null;
  }
}
