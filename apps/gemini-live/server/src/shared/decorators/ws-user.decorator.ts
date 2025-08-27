import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

export const WsUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const client = ctx.switchToWs().getClient();
  if (!client.handshake || !client.handshake.user) {
    throw new WsException('User not found in WebSocket handshake. Ensure WsJwtGuard is applied.');
  }
  return client.handshake.user;
});
