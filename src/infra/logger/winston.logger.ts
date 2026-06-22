import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';

/**
 * Winston-backed implementation of Nest's LoggerService. Structured JSON in
 * production, pretty colorized output in development.
 */
export class WinstonLogger implements LoggerService {
  private readonly logger: winston.Logger;

  constructor(appName = 'crm') {
    const isProd = process.env.NODE_ENV === 'production';

    this.logger = winston.createLogger({
      level: isProd ? 'info' : 'debug',
      defaultMeta: { service: appName },
      format: isProd
        ? winston.format.combine(winston.format.timestamp(), winston.format.json())
        : winston.format.combine(
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, stack }) => {
              const ctx = context ? `[${context}] ` : '';
              return `${timestamp} ${level} ${ctx}${stack ?? message}`;
            }),
          ),
      transports: [new winston.transports.Console()],
    });
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }
  error(message: any, stack?: string, context?: string) {
    this.logger.error(message, { stack, context });
  }
  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }
  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
  }
  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }
}
