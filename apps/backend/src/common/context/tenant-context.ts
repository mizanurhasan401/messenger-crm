import { AsyncLocalStorage } from "node:async_hooks";
import type { Role } from "@messenger/shared";

/** Per-request tenant identity, seeded by the auth + org guards. */
export interface TenantContext {
  userId: string;
  orgId: string;
  role: Role;
  memberId: string;
}

/**
 * Mutable holder placed in ALS by the request-context middleware. Guards fill in
 * fields as authentication/org-resolution completes within the same async chain.
 */
export type MutableTenantContext = Partial<TenantContext>;

export const tenantStorage = new AsyncLocalStorage<MutableTenantContext>();

/** Returns the partial store (may be incomplete before guards run). */
export function getTenantStore(): MutableTenantContext | undefined {
  return tenantStorage.getStore();
}

/** Returns the fully-resolved tenant context or undefined if not authenticated. */
export function getTenantContext(): TenantContext | undefined {
  const s = tenantStorage.getStore();
  if (s && s.userId && s.orgId && s.role && s.memberId) {
    return s as TenantContext;
  }
  return undefined;
}

export function requireTenantContext(): TenantContext {
  const ctx = getTenantContext();
  if (!ctx) {
    throw new Error("Tenant context is not available outside an authenticated request");
  }
  return ctx;
}
