import {
  Injectable,
  Logger,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleControlService } from '../module-control/module-control.service';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class LogService implements OnModuleInit {
  private readonly logger = new Logger(LogService.name);

  constructor(
    private prisma: PrismaService,
    private readonly moduleControlService: ModuleControlService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    this.logger.log(`LogModule initialization completed.`);
    if (!this.moduleControlService.isModuleEnabled('LogModule')) {
      this.logger.warn(
        'LogModule is disabled at startup. Logging will be inactive.',
      );
    }
  }

  private ensureLogModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('LogModule')) {
      throw new ForbiddenException('Log module is disabled');
    }
  }

  systemLog(message: string) {
    this.logger.log(message, 'System');
    return this.createAndStream({
      type: 'SYSTEM',
      level: 'INFO',
      data: { message, context: 'System' },
      tags: ['system'],
    });
  }

  logSystemError(message: string, stack?: string, context?: string) {
    this.logger.error(message, stack, context);
    return this.createAndStream({
      type: 'ERROR',
      level: 'ERROR',
      data: { message, stack, context },
      tags: ['error', 'system'],
    });
  }

  async websocket(event: string, clientId: string) {
    this.logger.debug(`WebSocket ${event} ${clientId}`, 'WebSocket');
    return this.createAndStream({
      type: 'WEBSOCKET',
      level: 'INFO',
      data: { event, clientId },
      tags: ['websocket'],
    });
  }

  async auth(action: string, userId: string, ip?: string) {
    this.logger.log(`Auth ${action} for ${userId}`, 'Auth');
    return this.createAndStream({
      type: 'AUTH',
      level: 'INFO',
      data: { action, userId, ip },
      tags: ['auth'],
    });
  }

  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId: string,
  ) {
    const msg = `${method} ${url} ${statusCode} - ${duration}ms`;
    this.logger.log(msg, 'HTTP');
    return this.createAndStream({
      type: 'HTTP',
      level: 'INFO',
      data: { method, url, statusCode, duration, userId },
      tags: ['http'],
    });
  }

  async createAndStream(data: CreateLogDto) {
    this.ensureLogModuleEnabled();

    const tags =
      data.tags && data.tags.length > 0 ? data.tags : [data.type.toLowerCase()];

    const log = await this.prisma.logs.create({
      data: {
        ...data,
        tags,
      },
    });

    //this.eventEmitter.emit('log.created', log);
    return log;
  }

  create(data: CreateLogDto) {
    this.ensureLogModuleEnabled();

    const tags =
      data.tags && data.tags.length > 0 ? data.tags : [data.type.toLowerCase()];

    return this.prisma.logs.create({
      data: {
        ...data,
        tags,
      },
    });
  }

  findAll() {
    this.ensureLogModuleEnabled();
    return this.prisma.logs.findMany();
  }

  findOne(id: string) {
    this.ensureLogModuleEnabled();
    return this.prisma.logs.findUnique({
      where: { id },
    });
  }

  update(id: string, data: UpdateLogDto) {
    this.ensureLogModuleEnabled();

    const tags = data.tags && data.tags.length > 0 ? data.tags : undefined;

    return this.prisma.logs.update({
      where: { id },
      data: {
        ...data,
        ...(tags && { tags }),
      },
    });
  }

  remove(id: string) {
    this.ensureLogModuleEnabled();
    return this.prisma.logs.delete({
      where: { id },
    });
  }
}
