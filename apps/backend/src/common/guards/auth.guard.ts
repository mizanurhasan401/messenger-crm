import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import { AUTH, type Auth } from "../../auth/better-auth.config";
import { getTenantStore } from "../context/tenant-context";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

/**
 * Validates the Better Auth session (cookie for dashboard, bearer for extension)
 * and seeds `userId` into the request tenant context. Runs first in the guard chain.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH) private readonly auth: Auth,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const session = await this.auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      throw new UnauthorizedException("Authentication required");
    }

    const store = getTenantStore();
    if (store) {
      store.userId = session.user.id;
    }
    // Stash for downstream guards that need raw user info.
    (req as Request & { userId?: string }).userId = session.user.id;
    return true;
  }
}
