import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { MemberStatus, ORG_HEADER } from "@messenger/shared";
import type { Request } from "express";
import { getTenantStore } from "../context/tenant-context";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { SKIP_ORG_KEY } from "../decorators/skip-org.decorator";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Resolves the active organization for the request and verifies membership.
 * Active org comes from the `x-organization-id` header (dashboard org-switcher +
 * extension). If absent and the user belongs to exactly one org, that one is used.
 * Seeds orgId/role/memberId into the tenant context.
 */
@Injectable()
export class OrgGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const skipOrg = this.reflector.getAllAndOverride<boolean>(SKIP_ORG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipOrg) return true;

    const req = context.switchToHttp().getRequest<Request & { userId?: string }>();
    const userId = req.userId;
    if (!userId) throw new ForbiddenException("No authenticated user");

    const headerOrg = req.headers[ORG_HEADER];
    const requestedOrgId = Array.isArray(headerOrg) ? headerOrg[0] : headerOrg;

    const membership = requestedOrgId
      ? await this.prisma.organizationMember.findUnique({
          where: { organizationId_userId: { organizationId: requestedOrgId, userId } },
        })
      : await this.resolveSoleMembership(userId);

    if (!membership || membership.status !== MemberStatus.ACTIVE) {
      throw new ForbiddenException("You are not an active member of this organization");
    }

    const store = getTenantStore();
    if (store) {
      store.orgId = membership.organizationId;
      store.role = membership.role;
      store.memberId = membership.id;
    }
    return true;
  }

  private async resolveSoleMembership(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId, status: MemberStatus.ACTIVE },
      take: 2,
    });
    if (memberships.length === 1) return memberships[0];
    // Ambiguous (0 or >1) → require explicit org header.
    return null;
  }
}
