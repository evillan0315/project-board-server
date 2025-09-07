import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { TerminalCommandDto } from './dto/terminal-command.dto';
import { SshCommandDto } from './dto/ssh-command.dto';
import { GetPackageScriptsDto } from './dto/get-package-scripts.dto';
import { ProjectScriptsResponse } from './interfaces/package-script.interface';
import { TerminalService } from './terminal.service';

import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { readFileSync } from 'fs';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Terminal')
@Controller('api/terminal')
export class TerminalController {
  private readonly logger = new Logger(TerminalController.name);

  constructor(private readonly terminalService: TerminalService) {}
  @Post('ssh/run')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Execute SSH command on a remote server',
    description:
      'Runs a single SSH command on a remote Linux server using either a password or private key authentication. Returns stdout or error output.',
  })
  @ApiBody({
    type: SshCommandDto,
    examples: {
      example1: {
        summary: 'Run uptime via password authentication',
        value: {
          host: '192.168.1.10',
          port: 22,
          username: 'ubuntu',
          password: 'securepassword',
          command: 'uptime',
        },
      },
      example2: {
        summary: 'Run disk usage via private key authentication',
        value: {
          host: 'example.com',
          port: 22,
          username: 'ec2-user',
          privateKeyPath: '/home/user/.ssh/id_rsa',
          command: 'df -h',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Command executed successfully',
    schema: {
      example: '15:42:35 up 2 days,  3:12,  2 users,  load average: 0.15, 0.09, 0.10\n',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or SSH command failed',
    schema: {
      example: {
        message: 'SSH command failed',
        details: 'Permission denied (publickey,password).',
      },
    },
  })
  async runSshCommand(@Body() body: SshCommandDto): Promise<string> {
    const { host, port, username, password, privateKeyPath, command } = body;

    try {
      // Optional: validate key existence if provided
      if (privateKeyPath) {
        readFileSync(privateKeyPath); // throws if invalid
      }

      return await this.terminalService.runSshCommandOnce({
        host,
        port: port || 22,
        username,
        password,
        privateKeyPath,
        command,
      });
    } catch (error) {
      throw new HttpException(
        {
          message: 'SSH command failed',
          details: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  @Post('run')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Execute a terminal command locally',
    description: 'Runs a local terminal command and returns stdout/stderr/exit code.',
  })
  @ApiBody({ type: TerminalCommandDto })
  @ApiResponse({
    status: 200,
    description: 'Command executed successfully',
    schema: {
      example: {
        stdout: 'example output',
        stderr: '',
        exitCode: 0,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input or command failed' })
  async runCommand(@Body() body: TerminalCommandDto) {
    const { command, cwd } = body;

    try {
      const result = await this.terminalService.runCommandOnce(command, cwd);
      return result;
    } catch (error) {
      throw new HttpException(
        { message: 'Command execution failed', details: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('package-scripts')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get package.json scripts and detect package manager',
    description:
      'Reads the package.json file from the specified project root and returns its scripts and detected package manager.',
  })
  @ApiBody({ type: GetPackageScriptsDto })
  @ApiResponse({
    status: 200,
    description: 'Package scripts retrieved successfully',
    schema: {
      example: {
        scripts: [
          { name: 'dev', script: 'vite' },
          { name: 'build', script: 'tsc && vite build' },
        ],
        packageManager: 'pnpm',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input or failed to read package.json' })
  async getPackageScripts(@Body() body: GetPackageScriptsDto): Promise<ProjectScriptsResponse> {
    try {
      return await this.terminalService.getPackageScripts(body.projectRoot);
    } catch (error) {
      this.logger.error(
        `Failed to load package scripts for project root: ${body.projectRoot}. Error: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        { message: 'Failed to load package scripts', details: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /*@Post('ssh')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Execute a remote SSH command',
    description: 'Runs a command on a remote server over SSH.',
  })
  @ApiBody({ type: SshCommandDto })
  @ApiResponse({
    status: 200,
    description: 'SSH command executed successfully',
    schema: {
      example: '15:21:00 up 10 days,  3:01,  1 user,  load average: 0.08, 0.10, 0.09',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'SSH command execution failed',
  })
  async runSshCommand(@Body() body: SshCommandDto): Promise<string> {
    const { host, port, username, password, privateKeyPath, command } = body;

    try {
      const config: any = {
        host,
        port: port || 22,
        username,
      };

      if (privateKeyPath) {
        config.privateKey = readFileSync(privateKeyPath);
      } else if (password) {
        config.password = password;
      } else {
        throw new Error('SSH requires either a password or private key path');
      }


      return await this.terminalService.runSshCommandOnce({
	  host,
	  port,
	  username,
	  password,
	  privateKeyPath,
	  command,
	});
    } catch (error) {
      throw new HttpException(
        { message: 'SSH command failed', details: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }*/
}
