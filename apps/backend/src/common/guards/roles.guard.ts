import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role } from "@messenger/shared";
import { getTenantStore } from "../context/tenant-context";
import { ROLES_KEY } from "../decorators/roles.decorator";

/**
 * Enforces @Roles(...) by comparing the required roles against the active
 * membership role resolved by OrgGuard. Routes without @Roles are allowed for
 * any authenticated member.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const role = getTenantStore()?.role;
    if (!role || !required.includes(role)) {
      throw new ForbiddenException("Insufficient role for this action");
    }
    return true;
  }
}
