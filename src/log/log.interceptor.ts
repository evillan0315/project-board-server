import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { LogService } from './log.service';

@Injectable()
export class LogInterceptor implements NestInterceptor {
  constructor(private readonly logService: LogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Only intercept HTTP requests
    if (!context.switchToHttp) {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest();
    const { method, url, user } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          try {
            const res = httpContext.getResponse();
            const { statusCode } = res;
            const duration = Date.now() - start;

            this.logService.logHttpRequest(
              method,
              url,
              statusCode,
              duration,
              user?.id ?? 'anonymous',
            );
          } catch (e) {
            // Handle if context is not HTTP (unlikely here, but safe guard)
          }
        },
        error: (err) => {
          this.logService.logSystemError(
            err.message,
            err.stack,
            `${method} ${url}`,
          );
        },
      }),
    );
  }
}
