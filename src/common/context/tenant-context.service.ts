import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { CLS_KEYS } from '../constants';
import { AppRole } from '../enums/role.enum';

/**
 * Request-scoped tenant context backed by AsyncLocalStorage (nestjs-cls).
 *
 * This is THE single source of truth for "who is making this request and
 * which organization do they belong to". Repositories read `organizationId`
 * from here to enforce tenant isolation without threading it through every
 * method signature.
 */
@Injectable()
export class TenantContext {
  constructor(private readonly cls: ClsService) {}

  get userId(): string | undefined {
    return this.cls.get(CLS_KEYS.USER_ID);
  }

  get organizationId(): string | undefined {
    return this.cls.get(CLS_KEYS.ORG_ID);
  }

  get role(): AppRole | undefined {
    return this.cls.get(CLS_KEYS.ROLE);
  }

  get requestId(): string | undefined {
    return this.cls.get(CLS_KEYS.REQUEST_ID);
  }

  /**
   * Returns the current organization id or throws — use in repositories where
   * a missing tenant id is a programming error (a route slipped past the guard).
   */
  requireOrganizationId(): string {
    const orgId = this.organizationId;
    if (!orgId) {
      throw new Error('TenantContext: organizationId is not set for this request');
    }
    return orgId;
  }

  set(data: { userId: string; organizationId: string; role: AppRole }): void {
    this.cls.set(CLS_KEYS.USER_ID, data.userId);
    this.cls.set(CLS_KEYS.ORG_ID, data.organizationId);
    this.cls.set(CLS_KEYS.ROLE, data.role);
  }
}
