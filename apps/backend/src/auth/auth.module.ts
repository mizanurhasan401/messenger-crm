import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AUTH, createAuth } from "./better-auth.config";
import type { Env } from "../config/env.validation";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Provides the singleton Better Auth instance (built on the shared Prisma client)
 * so guards and the mounted handler share one source of truth.
 */
@Global()
@Module({
  providers: [
    {
      provide: AUTH,
      inject: [PrismaService, ConfigService],
      useFactory: (prisma: PrismaService, config: ConfigService<Env, true>) =>
        createAuth(prisma, {
          NODE_ENV: config.get("NODE_ENV", { infer: true }),
          PORT: config.get("PORT", { infer: true }),
          DATABASE_URL: config.get("DATABASE_URL", { infer: true }),
          REDIS_URL: config.get("REDIS_URL", { infer: true }),
          BETTER_AUTH_SECRET: config.get("BETTER_AUTH_SECRET", { infer: true }),
          BETTER_AUTH_URL: config.get("BETTER_AUTH_URL", { infer: true }),
          AUTH_TRUSTED_ORIGINS: config.get("AUTH_TRUSTED_ORIGINS", { infer: true }),
          CORS_ORIGINS: config.get("CORS_ORIGINS", { infer: true }),
          SENTRY_DSN: config.get("SENTRY_DSN", { infer: true }),
          EMAIL_FROM: config.get("EMAIL_FROM", { infer: true }),
          SMTP_HOST: config.get("SMTP_HOST", { infer: true }),
          SMTP_PORT: config.get("SMTP_PORT", { infer: true }),
          SMTP_USER: config.get("SMTP_USER", { infer: true }),
          SMTP_PASS: config.get("SMTP_PASS", { infer: true }),
        }),
    },
  ],
  exports: [AUTH],
})
export class AuthModule {}
