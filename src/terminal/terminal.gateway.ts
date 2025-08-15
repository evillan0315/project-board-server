import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards, Logger, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as os from 'os';
import * as process from 'process';
import { resolve } from 'path';
import { existsSync, statSync } from 'fs';
import { Client as SSHClient, ConnectConfig } from 'ssh2';
import { ExecDto } from './dto/exec.dto';
import { TerminalService } from './terminal.service';
import { AuthService } from '../auth/auth.service';

import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: 'terminal',
})
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly BASE_DIR = `${process.env.BASE_DIR}`;
  private readonly logger = new Logger(TerminalGateway.name);

  @WebSocketServer()
  server: Server;

  private cwdMap = new Map<string, string>();
  private sshClientMap = new Map<string, SSHClient>();
  private sshStreamMap = new Map<string, any>();

  constructor(
    private readonly authService: AuthService,
    private readonly terminalService: TerminalService,
  ) {}

  private disposeSsh(clientId: string) {
    const sshClient = this.sshClientMap.get(clientId);
    if (sshClient) {
      sshClient.end();
      this.sshClientMap.delete(clientId);
    }
    this.sshStreamMap.delete(clientId);
  }
  handleCwdChange(client: Socket, cwd: string) {
    // Add the code here
  }
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token?.replace('Bearer ', '').trim();

      if (!token) {
        throw new UnauthorizedException('Missing or malformed token');

        client.emit('outputMessage', 'Authentication required');
      }
      const clientId = client.id;
      this.logger.log(`Client connected: ${clientId}`);

      // Initialize CWD for the client
      const initialCwd = this.BASE_DIR || os.homedir();
      this.cwdMap.set(client.id, initialCwd);

      // Initialize the persistent PTY session for this client
      this.terminalService.initializePtySession(clientId, client, initialCwd);

      client.emit('outputMessage', 'Welcome to the terminal!\n');
      client.emit('outputPath', this.cwdMap.get(clientId));
      client.emit('outputInfo', {
        platform: os.platform(),
        type: os.type(),
        release: os.release(),
        arch: os.arch(),
        uptime: os.uptime(),
        hostname: os.hostname(),
        cwd: this.cwdMap.get(clientId),
      });
      // Emit initial prompt after connection
      client.emit('prompt', { cwd: initialCwd, command: '' });

      client.on('disconnect', () => this.handleDisconnect(client));
    } catch (err) {
      this.logger.warn(`Connection rejected: ${err.message}`);
      client.emit('error', `Unauthorized: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const clientId = client.id;
    this.terminalService.dispose(clientId);
    this.cwdMap.delete(clientId);
    this.disposeSsh(clientId);
    this.logger.log(`Client disconnected: ${clientId}`);
  }
  @SubscribeMessage('exec_terminal')
  async handleCommandTerminal(@MessageBody() payload: ExecDto, @ConnectedSocket() client: Socket) {
    const clientId = client.id;
    let currentCwd = this.cwdMap.get(clientId) || process.cwd();

    if (payload.newCwd !== undefined) {
      const targetCwd = payload.newCwd.trim();
      if (existsSync(targetCwd) && statSync(targetCwd).isDirectory()) {
        this.cwdMap.set(clientId, targetCwd);
        currentCwd = targetCwd;
        this.logger.debug(`Client ${clientId} CWD changed to: ${targetCwd}`);
      } else {
        client.emit('error', `Invalid directory requested: ${targetCwd}\n`);
        this.logger.warn(`Client ${clientId} requested invalid CWD: ${targetCwd}`);
      }
      if (payload.command === undefined) {
        client.emit('prompt', { cwd: currentCwd, command: '' });
        return;
      }
    }

    if (payload.command === undefined) {
      return;
    }

    const command = payload.command.trim();

    if (this.sshStreamMap.has(clientId)) {
      const stream = this.sshStreamMap.get(clientId);
      stream.write(`${command}\n`);
      client.emit('prompt', { cwd: currentCwd, command });
      return;
    }

    // Handle internal commands (cd, osinfo) directly in the gateway
    if (command.startsWith('cd')) {
      const target = command.slice(3).trim();
      const newCwd = target === '' ? os.homedir() : resolve(currentCwd, target);

      if (existsSync(newCwd) && statSync(newCwd).isDirectory()) {
        this.cwdMap.set(clientId, newCwd);
        currentCwd = newCwd;
        // Do not emit 'output' here; let the PTY handle the output for 'cd'
        // Instead, just emit the prompt with the new CWD.
      } else {
        // Emit error message through the PTY output for consistency
        this.terminalService.write(clientId, `No such directory: ${newCwd}\n`);
      }
      client.emit('prompt', { cwd: currentCwd, command });
      return;
    }

    if (command === 'osinfo') {
      const info = {
        platform: os.platform(),
        type: os.type(),
        release: os.release(),
        arch: os.arch(),
        uptime: os.uptime(),
        hostname: os.hostname(),
        cwd: currentCwd,
        homedir: os.homedir(),
      };
      // Emit info through the PTY output for consistency
      this.terminalService.write(
        clientId,
        Object.entries(info)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n') + '\n',
      );
      client.emit('prompt', { cwd: currentCwd, command });
      return;
    }

    // For all other commands, write to the persistent PTY
    try {
      client.emit('prompt', { cwd: currentCwd, command }); // Emit prompt *before* writing command to PTY
      this.terminalService.write(clientId, `${command}\n`); // Write command to PTY
    } catch (err) {
      this.logger.error(`Command failed for client ${clientId}: ${err.message}`, err.stack);
      this.terminalService.write(clientId, `Command error: ${err.message}\n`); // Emit error via PTY output
      client.emit('prompt', { cwd: currentCwd, command: '' });
    }
  }

  // This 'exec' handler seems to be an older one; 'exec_terminal' is preferred.
  // Keeping it for now but noting its potential redundancy.
  @SubscribeMessage('exec')
  handleCommand(@MessageBody() command: string, @ConnectedSocket() client: Socket) {
    const clientId = client.id;
    const cwd = this.cwdMap.get(clientId) || process.cwd();
    const trimmed = command.trim();

    if (this.sshStreamMap.has(clientId)) {
      const stream = this.sshStreamMap.get(clientId);
      stream.write(`${command}\n`);
      return;
    }

    if (trimmed.startsWith('cd')) {
      const target = trimmed.slice(3).trim() || os.homedir();
      const newCwd = target.startsWith('/') ? target : resolve(cwd, target);
      if (existsSync(newCwd) && statSync(newCwd).isDirectory()) {
        this.cwdMap.set(clientId, newCwd);
        // this.terminalService.write(clientId, `Changed directory to ${newCwd}\n`); // Removed direct emit, let PTY handle output
      } else {
        this.terminalService.write(clientId, `No such directory: ${newCwd}\n`);
      }
      client.emit('prompt', { cwd: newCwd, command });
      return;
    }

    if (trimmed === 'osinfo') {
      const info = {
        platform: os.platform(),
        type: os.type(),
        release: os.release(),
        arch: os.arch(),
        uptime: os.uptime(),
        hostname: os.hostname(),
        cwd,
      };
      this.terminalService.write(
        clientId,
        Object.entries(info)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n') + '\n',
      );
      return;
    }

    try {
      client.emit('prompt', { cwd, command });
      this.terminalService.write(clientId, `${command}\n`); // Use write to existing PTY
    } catch (err) {
      this.logger.error(`Command failed: ${err.message}`);
      this.terminalService.write(clientId, `Command error: ${err.message}\n`);
    }
  }

  @SubscribeMessage('ssh-connect')
  async handleSshConnect(
    @MessageBody()
    payload: {
      host: string;
      port?: number;
      username: string;
      password?: string;
      privateKey?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const clientId = client.id;

    if (this.sshClientMap.has(clientId)) {
      client.emit('error', 'SSH session already active');
      return;
    }

    const sshClient = new SSHClient();

    const config: ConnectConfig = {
      host: payload.host,
      port: payload.port || 22,
      username: payload.username,
      ...(payload.password ? { password: payload.password } : {}),
      ...(payload.privateKey ? { privateKey: payload.privateKey } : {}),
    };

    sshClient
      .on('ready', () => {
        this.logger.log(`SSH connected: ${clientId}`);
        client.emit('output', `Connected to ${payload.host}\n`);

        sshClient.shell((err, stream) => {
          if (err) {
            client.emit('error', `Shell error: ${err.message}`);
            return;
          }
          this.sshStreamMap.set(clientId, stream);
          stream.on('data', (data: Buffer) => client.emit('output', data.toString()));
          stream.on('close', () => {
            client.emit('output', 'SSH session closed\n');
            this.disposeSsh(clientId);
          });
        });
      })
      .on('error', (err) => {
        client.emit('error', `SSH error: ${err.message}`);
        this.disposeSsh(clientId);
      })
      .on('end', () => {
        client.emit('output', 'SSH connection ended\n');
        this.disposeSsh(clientId);
      })
      .on('close', () => {
        client.emit('output', 'SSH connection closed\n');
        this.disposeSsh(clientId);
      })
      .connect(config);

    this.sshClientMap.set(clientId, sshClient);
  }

  @SubscribeMessage('input')
  handleInput(@MessageBody() data: { input: string }, @ConnectedSocket() client: Socket) {
    const clientId = client.id;

    if (this.sshStreamMap.has(clientId)) {
      this.sshStreamMap.get(clientId).write(data.input);
      return;
    }

    this.terminalService.write(clientId, data.input);
  }

  @SubscribeMessage('resize')
  handleResize(
    @MessageBody() data: { cols: number; rows: number },
    @ConnectedSocket() client: Socket,
  ) {
    this.terminalService.resize(client.id, data.cols, data.rows);
  }

  @SubscribeMessage('close')
  handleSessionClose(@ConnectedSocket() client: Socket) {
    this.terminalService.dispose(client.id);
    this.disposeSsh(client.id);
  }
}
