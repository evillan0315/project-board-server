import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../types/user';

export interface JwtPayload {
  userId: string;
  email: string;
  name?: string;
  // Add any other fields you expect in the JWT payload from your OAuth backend
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // For WebSocket, expect token in `socket.handshake.auth.token` which might be `Bearer <token>`
        (req: any) => {
          const token = req?.handshake?.auth?.token;
          if (token && token.startsWith('Bearer ')) {
            return token.substring(7);
          }
          return null;
        },
        // Also consider HTTP authorization header for RESTful endpoints if this strategy is reused
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    // In a real application, you would fetch the user from a database
    // to ensure they still exist and are authorized.
    // For this example, we trust the JWT payload's basic info.
    return {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      // Assign a default role or fetch from DB
      role: 'USER',
      provider: 'unknown',
    };
  }
}
