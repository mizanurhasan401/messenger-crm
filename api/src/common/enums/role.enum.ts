// Mirror of Prisma `Role` enum, re-exported for app-layer use without
// coupling every file to the generated client.
export enum AppRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  AGENT = 'AGENT',
}

/** Hierarchy weight — higher number ⇒ more privileged. */
export const ROLE_WEIGHT: Record<AppRole, number> = {
  [AppRole.OWNER]: 40,
  [AppRole.ADMIN]: 30,
  [AppRole.MANAGER]: 20,
  [AppRole.AGENT]: 10,
};
