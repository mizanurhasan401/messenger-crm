import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

interface ErrorBody {
  success: false;
  message: string;
  errors: unknown[];
  path: string;
  timestamp: string;
}

/**
 * Global exception filter producing the standard error envelope:
 *   { success: false, message, errors }
 *
 * Maps HttpException, Prisma known errors, and unknown errors to sane
 * HTTP statuses. Never leaks stack traces to clients in production.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: unknown[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, any>;
        message = Array.isArray(r.message) ? 'Validation failed' : (r.message ?? exception.message);
        errors = Array.isArray(r.message) ? r.message : (r.errors ?? []);
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      ({ status, message } = this.mapPrismaError(exception));
      errors = [{ code: exception.code }];
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid database query';
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ErrorBody = {
      success: false,
      message,
      errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).send(body);
  }

  private mapPrismaError(e: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (e.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: `Unique constraint failed on: ${(e.meta?.target as string[])?.join(', ') ?? 'field'}`,
        };
      case 'P2025':
        return { status: HttpStatus.NOT_FOUND, message: 'Record not found' };
      case 'P2003':
        return { status: HttpStatus.BAD_REQUEST, message: 'Foreign key constraint failed' };
      default:
        return { status: HttpStatus.BAD_REQUEST, message: `Database error (${e.code})` };
    }
  }
}
