import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

/**
 * Custom adapter for Socket.io to configure global settings,
 * such as CORS, consistently with the HTTP application settings.
 */
export class SocketIoAdapter extends IoAdapter {
  private readonly logger = new Logger('SocketIoAdapter');

  constructor(private app: INestApplicationContext) {
    super(app);
  }

  /**
   * Overrides the default method to create and configure the Socket.io server.
   */
  createIOServer(port: number, options?: ServerOptions): any {
    // IMPORTANT: Mirror the allowedOrigins from main.ts here to configure CORS for WebSockets
    const allowedOrigins = [
      'https://board-api.duckdns.org',
      'http://localhost:5000',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:5173',
    ];

    this.logger.log(`Configuring Socket.io with CORS origins: ${allowedOrigins.join(', ')}`);

    const corsOptions = {
      // Socket.io uses 'origin' to define the allowed handshake sources
      origin: allowedOrigins, 
      methods: ['GET', 'POST'],
      credentials: true,
    };

    // Create the server, merging default options with our custom CORS settings
    const server = super.createIOServer(port, { 
        ...options, 
        cors: corsOptions,
        // Recommended: lower the maxHttpBufferSize if your application doesn't need huge payloads
        maxHttpBufferSize: 1e8 // 100MB 
    });

    return server;
  }
}
