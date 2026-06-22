import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export const RESPONSE_MESSAGE_KEY = 'responseMessage';

/**
 * Wraps every successful handler return value into the standard envelope:
 *   { success: true, message, data, meta? }
 *
 * If a handler returns `{ data, meta }` it is unwrapped so pagination metadata
 * lands at the top level alongside `data`.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiSuccessResponse<T>> {
    const message =
      this.reflector.get<string>(RESPONSE_MESSAGE_KEY, context.getHandler()) ?? 'Success';

    return next.handle().pipe(
      map((payload: any) => {
        if (payload && typeof payload === 'object' && 'data' in payload && 'meta' in payload) {
          return {
            success: true as const,
            message,
            data: payload.data,
            meta: payload.meta,
          };
        }
        return { success: true as const, message, data: payload };
      }),
    );
  }
}
