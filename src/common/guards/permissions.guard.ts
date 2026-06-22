import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../constants';
import { AppRole } from '../enums/role.enum';
import { Permission, permissionsForRole } from '../enums/permission.enum';

/**
 * Granular RBAC. Resolves the user's effective permissions from their role
 * and requires ALL @RequirePermissions(...) to be present.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Not authenticated');

    const granted = permissionsForRole(user.role as AppRole);
    const ok = required.every((p) => granted.includes(p));
    if (!ok) {
      throw new ForbiddenException(
        `Missing permission(s): ${required.filter((p) => !granted.includes(p)).join(', ')}`,
      );
    }
    return true;
  }
}
