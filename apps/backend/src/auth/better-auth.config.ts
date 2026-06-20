import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";
import type { PrismaClient } from "@messenger/database";
import type { Env } from "../config/env.validation";

/**
 * Single Better Auth instance for the platform. Mounted in main.ts at /api/auth/*.
 *
 * - email/password with verification + reset enabled
 * - bearer plugin so the Chrome extension can authenticate via Authorization header
 *   (cookies are unreliable from messenger.com content scripts)
 *
 * Email sending is wired to a transport in Phase 7; for now verification/reset
 * links are logged so local development works without SMTP.
 */
export function createAuth(prisma: PrismaClient, env: Env) {
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: env.AUTH_TRUSTED_ORIGINS.split(",").map((o) => o.trim()),
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      async sendResetPassword({ user, url }) {
        // eslint-disable-next-line no-console
        console.warn(`[auth] password reset for ${user.email}: ${url}`);
      },
    },
    emailVerification: {
      async sendVerificationEmail({ user, url }) {
        // eslint-disable-next-line no-console
        console.warn(`[auth] verify email for ${user.email}: ${url}`);
      },
    },
    plugins: [bearer()],
    advanced: {
      // Allow cross-subdomain cookies in production (dashboard + api).
      crossSubDomainCookies: { enabled: env.NODE_ENV === "production" },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

/** DI token for the Better Auth instance. */
export const AUTH = "BETTER_AUTH_INSTANCE";
