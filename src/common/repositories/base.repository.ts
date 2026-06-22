import { TenantContext } from '../context/tenant-context.service';

/**
 * Base class for tenant-scoped repositories.
 *
 * Provides `orgId` (the current request's organization id) and a helper to
 * merge it into Prisma `where` clauses so concrete repositories never forget
 * to scope a query. This is the structural enforcement point for the
 * "every query is filtered by organization_id" multi-tenancy rule.
 */
export abstract class BaseRepository {
  protected constructor(protected readonly tenant: TenantContext) {}

  protected get orgId(): string {
    return this.tenant.requireOrganizationId();
  }

  /** Merge tenant scope into a where clause. */
  protected scoped<W extends Record<string, unknown>>(where?: W): W & { organizationId: string } {
    return { ...(where ?? ({} as W)), organizationId: this.orgId };
  }
}
