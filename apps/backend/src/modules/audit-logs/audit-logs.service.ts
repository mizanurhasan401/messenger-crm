import { Injectable } from "@nestjs/common";
import { AuditAction, PaginationQuery } from "@messenger/shared";
import type { Prisma } from "@messenger/database";
import { TenantPrismaService } from "../../prisma/tenant-prisma.service";

@Injectable()
export class AuditLogsService {
  constructor(private readonly db: TenantPrismaService) {}

  /** Record a mutation. Called by services after privileged changes. */
  record(params: {
    actorUserId: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    diff?: Prisma.InputJsonValue;
    ipAddress?: string;
  }) {
    return this.db.client.auditLog.create({
      data: {
        actorUserId: params.actorUserId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        diff: params.diff,
        ipAddress: params.ipAddress,
      } as Prisma.AuditLogUncheckedCreateInput,
    });
  }

  async list(query: PaginationQuery & { entityType?: string }) {
    const { page, pageSize } = query;
    const where: Prisma.AuditLogWhereInput = {};
    if (query.entityType) where.entityType = query.entityType;

    const [data, total] = await Promise.all([
      this.db.client.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.client.auditLog.count({ where }),
    ]);
    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    };
  }
}
