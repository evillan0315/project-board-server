/**
 * FilePath: src/openvidu/openvidu.service.ts
 * Title: Updated OpenVidu service compatible with openvidu-node-client v2.25.0
 * Reason: Adapted to API changes (removed fetchSession, disconnect)
 */

import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OpenVidu,
  Session,
  Connection,
  ConnectionProperties,
  OpenViduRole as OVRole,
} from 'openvidu-node-client';
import { GenerateOpenViduTokenDto } from './dto/generate-openvidu-token.dto';

@Injectable()
export class OpenviduService {
  private readonly logger = new Logger(OpenviduService.name);
  private openvidu: OpenVidu;
  private activeSessions = new Map<string, Session>();

  constructor(private configService: ConfigService) {
    const openviduUrl = this.configService.get<string>('OPENVIDU_URL');
    const openviduSecret = this.configService.get<string>('OPENVIDU_SECRET');

    if (!openviduUrl || !openviduSecret) {
      this.logger.error('OpenVidu URL or Secret not configured.');
      throw new InternalServerErrorException(
        'OpenVidu credentials not configured.',
      );
    }

    this.openvidu = new OpenVidu(openviduUrl, openviduSecret);
    this.logger.log(`OpenVidu initialized with URL: ${openviduUrl}`);
  }

  async createSession(customSessionId?: string): Promise<Session> {
    try {
      if (customSessionId && this.activeSessions.has(customSessionId)) {
        const existing = this.activeSessions.get(customSessionId)!;
        this.logger.log(`Returning existing session: ${customSessionId}`);
        return existing;
      }

      const sessionProps = customSessionId ? { customSessionId } : {};
      const session = await this.openvidu.createSession(sessionProps);
      this.activeSessions.set(session.sessionId, session);
      this.logger.log(`Session created: ${session.sessionId}`);
      return session;
    } catch (error) {
      if (error.message.includes('409') && customSessionId) {
        this.logger.warn(
          `Session ${customSessionId} already exists. Trying to fetch it...`,
        );

        await this.openvidu.fetch(); // Refresh local activeSessions list from OpenVidu server
        const existingSession = this.openvidu.activeSessions.find(
          (s) => s.sessionId === customSessionId,
        );

        if (existingSession) {
          this.activeSessions.set(existingSession.sessionId, existingSession);
          return existingSession;
        }

        throw new InternalServerErrorException(
          `Failed to fetch existing session ${customSessionId}`,
        );
      }

      this.logger.error(`Error creating session: ${error.message}`);
      throw new InternalServerErrorException(
        `OpenVidu session error: ${error.message}`,
      );
    }
  }

  async generateToken(dto: GenerateOpenViduTokenDto): Promise<string> {
    const {
      sessionId,
      role = OVRole.PUBLISHER,
      data = 'user_data',
      kurentoOptions,
    } = dto;

    let session = this.activeSessions.get(sessionId);

    if (!session) {
      this.logger.log(
        `Session ${sessionId} not found locally. Creating or fetching...`,
      );
      session = await this.createSession(sessionId);
    }

    try {
      const connectionProps: ConnectionProperties = {
        role,
        data,
        kurentoOptions,
      };
      const connection: Connection =
        await session.createConnection(connectionProps);
      this.logger.log(`Token generated for session ${sessionId}`);
      return connection.token;
    } catch (error) {
      this.logger.error(
        `Error generating token for session ${sessionId}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        `Token generation failed: ${error.message}`,
      );
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found.`);
    }

    try {
      // Try to close via internal REST API call
      await (this.openvidu as any).http.delete(`/api/sessions/${sessionId}`);
      this.activeSessions.delete(sessionId);
      this.logger.log(`Session ${sessionId} deleted via OpenVidu REST API.`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to delete session ${sessionId}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        `Failed to delete session: ${error.message}`,
      );
    }
  }

  getActiveSessionIds(): string[] {
    return Array.from(this.activeSessions.keys());
  }
}
