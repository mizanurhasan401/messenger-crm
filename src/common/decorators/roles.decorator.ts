import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants';
import { AppRole } from '../enums/role.enum';

/** Restrict a route to one or more roles. Enforced by RolesGuard. */
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
