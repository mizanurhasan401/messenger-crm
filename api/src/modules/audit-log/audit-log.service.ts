import { Injectable, Logger } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { TenantContext } from '../../common/context/tenant-context.service';
import { buildPaginationMeta, PaginatedResult, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { AuditLogRepository } from './audit-log.repository';

export interface AuditEntry {
  organizationId: string;
  userId?: string | null;
  action: AuditAction;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

/**
 * Append-only audit trail. `record` is fire-and-forget friendly — it swallows
 * its own errors so an audit failure never breaks the business operation.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    private readonly repo: AuditLogRepository,
    private readonly tenant: TenantContext,
  ) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.repo.create({
        organizationId: entry.organizationId,
        userId: entry.userId ?? undefined,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        metadata: entry.metadata as object,
        ip: entry.ip,
        userAgent: entry.userAgent,
      });
    } catch (err) {
      this.logger.warn(`Failed to write audit log: ${(err as Error).message}`);
    }
  }

  /** Convenience used by tenant-scoped services (org/user pulled from context). */
  async log(action: AuditAction, entity: string, entityId: string, metadata?: Record<string, unknown>) {
    await this.record({
      organizationId: this.tenant.requireOrganizationId(),
      userId: this.tenant.userId,
      action,
      entity,
      entityId,
      metadata,
    });
  }

  async list(query: PaginationQueryDto, action?: AuditAction): Promise<PaginatedResult<unknown>> {
    const [data, total] = await this.repo.paginate({
      organizationId: this.tenant.requireOrganizationId(),
      skip: query.skip,
      take: query.limit,
      action,
    });
    return { data, meta: buildPaginationMeta(total, query.page, query.limit) };
  }
}
