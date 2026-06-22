import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  /** Access-token jti — present on authenticated requests, used for revocation. */
  jti?: string;
}

/**
 * Injects the authenticated user (set by JwtStrategy) into a handler param.
 * Usage: `@CurrentUser() user: AuthUser` or `@CurrentUser('id') id: string`.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser;
    return data ? user?.[data] : user;
  },
);
