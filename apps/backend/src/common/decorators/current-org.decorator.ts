import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { requireTenantContext, type TenantContext } from "../context/tenant-context";

/** Injects the active tenant context (orgId, role, memberId, userId). */
export const CurrentOrg = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): TenantContext => {
    return requireTenantContext();
  },
);
