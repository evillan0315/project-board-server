import { CanActivate, Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(WsJwtGuard.name);

  getRequest(context: ExecutionContext) {
    // For WebSocket context, the request object is usually `client.handshake`
    return context.switchToWs().getClient().handshake;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (info) {
        this.logger.warn(`WebSocket JWT authentication failed: ${info.message || info}`);
      }
      throw err || new WsException('Unauthorized access');
    }
    return user;
  }
}
