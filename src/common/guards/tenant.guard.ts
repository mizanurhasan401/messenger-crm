import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { CLS_KEYS, IS_PUBLIC_KEY, SKIP_TENANT_KEY } from '../constants';

/**
 * Enforces multi-tenancy: every authenticated request MUST carry an
 * organization id, which is hydrated into the CLS TenantContext so that
 * repositories scope all queries by `organizationId` automatically.
 *
 * Runs after JwtAuthGuard (which populates request.user).
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const skipTenant = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic || skipTenant) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.organizationId) {
      throw new ForbiddenException('No tenant context: organization is required');
    }

    // Hydrate CLS so repositories / TenantContext can read it anywhere.
    this.cls.set(CLS_KEYS.USER_ID, user.id);
    this.cls.set(CLS_KEYS.ORG_ID, user.organizationId);
    this.cls.set(CLS_KEYS.ROLE, user.role);

    return true;
  }
}
