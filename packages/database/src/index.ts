/**
 * @messenger/database — backend-only Prisma client + types.
 *
 * Clients (dashboard / extension) must NOT import this package; doing so would
 * pull the Prisma engine into a browser bundle. Shared types reach clients via
 * @messenger/shared instead.
 */
export * from "./generated/client";
export { PrismaClient } from "./generated/client";
