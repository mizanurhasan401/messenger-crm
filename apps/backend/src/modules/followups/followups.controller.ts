import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import {
  createFollowupSchema,
  CreateFollowupInput,
  followupQuerySchema,
  Role,
  updateFollowupSchema,
  UpdateFollowupInput,
} from "@messenger/shared";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodBody } from "../../common/pipes/zod-validation.pipe";
import type { TenantContext } from "../../common/context/tenant-context";
import { FollowupsService } from "./followups.service";

@Controller("followups")
export class FollowupsController {
  constructor(private readonly followups: FollowupsService) {}

  @Get()
  list(@CurrentOrg() ctx: TenantContext, @Query() query: unknown) {
    return this.followups.list(ctx.orgId, followupQuerySchema.parse(query));
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.AGENT)
  @Post()
  create(
    @CurrentOrg() ctx: TenantContext,
    @CurrentUser() userId: string,
    @Body(new ZodBody(createFollowupSchema)) dto: CreateFollowupInput,
  ) {
    return this.followups.create(ctx.orgId, userId, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.AGENT)
  @Patch(":id")
  update(@Param("id") id: string, @Body(new ZodBody(updateFollowupSchema)) dto: UpdateFollowupInput) {
    return this.followups.update(id, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.AGENT)
  @Patch(":id/complete")
  complete(@Param("id") id: string) {
    return this.followups.complete(id);
  }
}
