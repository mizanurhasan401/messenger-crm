import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { requireTenantContext } from "../context/tenant-context";

/** Injects the authenticated user id resolved by AuthGuard. */
export const CurrentUser = createParamDecorator((_data: unknown, _ctx: ExecutionContext): string => {
  return requireTenantContext().userId;
});
