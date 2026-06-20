import { Injectable, Scope } from "@nestjs/common";
import { requireTenantContext } from "../common/context/tenant-context";
import { PrismaService } from "./prisma.service";

/**
 * Models that are NOT tenant-scoped and must be excluded from organizationId
 * injection (auth/global tables + the tenancy roots themselves).
 */
const ORG_AGNOSTIC_MODELS = new Set<string>([
  "User",
  "Account",
  "Session",
  "Verification",
  "Organization",
  "OrganizationMember",
  "OrgRole",
]);

function buildTenantClient(base: PrismaService, orgId: string) {
  return base.$extends({
    name: "tenant-isolation",
    query: {
      $allModels: {
        // Reads: force organizationId into the where clause.
        async findMany({ model, args, query }) {
          if (!ORG_AGNOSTIC_MODELS.has(model)) {
            args.where = { ...args.where, organizationId: orgId };
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (!ORG_AGNOSTIC_MODELS.has(model)) {
            args.where = { ...args.where, organizationId: orgId };
          }
          return query(args);
        },
        async findFirstOrThrow({ model, args, query }) {
          if (!ORG_AGNOSTIC_MODELS.has(model)) {
            args.where = { ...args.where, organizationId: orgId };
          }
          return query(args);
        },
        async findUnique({ model, args, query }) {
          // findUnique can't take non-unique filters; fall back to scoping after.
          const result = await query(args);
          if (
            !ORG_AGNOSTIC_MODELS.has(model) &&
            result &&
            (result as { organizationId?: string }).organizationId !== orgId
          ) {
            return null;
          }
          return result;
        },
        async count({ model, args, query }) {
          if (!ORG_AGNOSTIC_MODELS.has(model)) {
            args.where = { ...args.where, organizationId: orgId };
          }
          return query(args);
        },
        async aggregate({ model, args, query }) {
          if (!ORG_AGNOSTIC_MODELS.has(model)) {
            args.where = { ...args.where, organizationId: orgId };
          }
          return query(args);
        },
        async groupBy({ model, args, query }) {
          if (!ORG_AGNOSTIC_MODELS.has(model)) {
            args.where = { ...args.where, organizationId: orgId };
          }
          return query(args);
        },
        // Writes: stamp organizationId on create, scope it on update/delete.
        async create({ model, args, query }) {
          if (!ORG_AGNOSTIC_MODELS.has(model)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (args as any).data = { ...(args as any).data, organizationId: orgId };
          }
          return query(args);
        },
        async createMany({ model, args, query }) {
          if (!ORG_AGNOSTIC_MODELS.has(model)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rows = Array.isArray(args.data) ? args.data : [args.data];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (args as any).data = rows.map((d: any) => ({ ...d, organizationId: orgId }));
          }
          return query(args);
        },
        async update({ model, args, query }) {
          if (!ORG_AGNOSTIC_MODELS.has(model)) {
            args.where = { ...args.where, organizationId: orgId };
          }
          return query(args);
        },
        async updateMany({ model, args, query }) {
          if (!ORG_AGNOSTIC_MODELS.has(model)) {
            args.where = { ...args.where, organizationId: orgId };
          }
          return query(args);
        },
        async delete({ model, args, query }) {
          if (!ORG_AGNOSTIC_MODELS.has(model)) {
            args.where = { ...args.where, organizationId: orgId };
          }
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (!ORG_AGNOSTIC_MODELS.has(model)) {
            args.where = { ...args.where, organizationId: orgId };
          }
          return query(args);
        },
      },
    },
  });
}

export type TenantClient = ReturnType<typeof buildTenantClient>;

/**
 * Request-scoped, org-scoped Prisma client. Feature repositories inject THIS,
 * never PrismaService — making it impossible to forget the organizationId filter.
 *
 * Implementation note: we do NOT create a new PrismaClient/pool per request — we
 * only wrap the shared base client with a lightweight $extends bound to this
 * request's orgId (read from AsyncLocalStorage).
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantPrismaService {
  private cached?: TenantClient;

  constructor(private readonly base: PrismaService) {}

  get client(): TenantClient {
    if (!this.cached) {
      const { orgId } = requireTenantContext();
      this.cached = buildTenantClient(this.base, orgId);
    }
    return this.cached;
  }
}

/**
 * Factory for out-of-HTTP contexts (BullMQ workers) where there is no request
 * ALS — the orgId comes explicitly from the job payload.
 */
export function tenantClientForJob(base: PrismaService, orgId: string): TenantClient {
  return buildTenantClient(base, orgId);
}
