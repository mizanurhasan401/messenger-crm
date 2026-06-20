import { SetMetadata } from "@nestjs/common";
import type { Role } from "@messenger/shared";

export const ROLES_KEY = "roles";

/** Restricts a route to the given roles (checked by RolesGuard against ALS role). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
