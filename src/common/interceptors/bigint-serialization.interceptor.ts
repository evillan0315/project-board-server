import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { serializeBigInt } from '../utils/bigint.utils';

/**
 * Interceptor to automatically serialize BigInt values in API responses to strings.
 * This prevents `TypeError: Do not know how to serialize a BigInt` errors,
 * as JSON.stringify does not natively support BigInt.
 */
@Injectable()
export class BigIntSerializationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => serializeBigInt(data)));
  }
}
