import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/** Logs method, url, status and latency for each request. */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          const status = res.statusCode;
          this.logger.log(`${method} ${url} ${status} +${Date.now() - now}ms`);
        },
        error: (err) => {
          this.logger.error(
            `${method} ${url} ${err?.status ?? 500} +${Date.now() - now}ms — ${err?.message}`,
          );
        },
      }),
    );
  }
}
