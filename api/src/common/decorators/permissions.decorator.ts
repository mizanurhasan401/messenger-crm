import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../constants';
import { Permission } from '../enums/permission.enum';

/** Require granular permission(s) on a route. Enforced by PermissionsGuard. */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
