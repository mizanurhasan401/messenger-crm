import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Injects the current tenant's organization id into a handler param.
 * Usage: `@Tenant() organizationId: string`.
 *
 * The value is populated by TenantGuard / JwtStrategy on `request.user`.
 */
export const Tenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.organizationId;
  },
);
