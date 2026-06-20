import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import {
  createOrganizationSchema,
  CreateOrganizationInput,
  Role,
  updateOrganizationSchema,
  UpdateOrganizationInput,
} from "@messenger/shared";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { SkipOrg } from "../../common/decorators/skip-org.decorator";
import { ZodBody } from "../../common/pipes/zod-validation.pipe";
import type { TenantContext } from "../../common/context/tenant-context";
import { OrganizationsService } from "./organizations.service";

@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  /** List orgs the authenticated user belongs to (no active-org required). */
  @SkipOrg()
  @Get()
  list(@CurrentUser() userId: string) {
    return this.organizations.listForUser(userId);
  }

  /** Create a new org (also the post-signup first-org flow). */
  @SkipOrg()
  @Post()
  create(
    @CurrentUser() userId: string,
    @Body(new ZodBody(createOrganizationSchema)) dto: CreateOrganizationInput,
  ) {
    return this.organizations.create(userId, dto);
  }

  /** Read the active org. */
  @Get("current")
  current(@CurrentOrg() ctx: TenantContext) {
    return this.organizations.get(ctx.orgId);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Patch("current")
  update(
    @CurrentOrg() ctx: TenantContext,
    @Body(new ZodBody(updateOrganizationSchema)) dto: UpdateOrganizationInput,
  ) {
    return this.organizations.update(ctx.orgId, dto);
  }
}
