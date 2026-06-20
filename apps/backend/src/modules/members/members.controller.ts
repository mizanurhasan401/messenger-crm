import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import {
  inviteMemberSchema,
  InviteMemberInput,
  Role,
  updateMemberRoleSchema,
  UpdateMemberRoleInput,
} from "@messenger/shared";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodBody } from "../../common/pipes/zod-validation.pipe";
import type { TenantContext } from "../../common/context/tenant-context";
import { MembersService } from "./members.service";

@Controller("team")
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  list(@CurrentOrg() ctx: TenantContext) {
    return this.members.list(ctx.orgId);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Post("invite")
  invite(
    @CurrentOrg() ctx: TenantContext,
    @Body(new ZodBody(inviteMemberSchema)) dto: InviteMemberInput,
  ) {
    return this.members.invite(ctx.orgId, ctx.userId, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Patch(":memberId/role")
  updateRole(
    @CurrentOrg() ctx: TenantContext,
    @Param("memberId") memberId: string,
    @Body(new ZodBody(updateMemberRoleSchema)) dto: UpdateMemberRoleInput,
  ) {
    return this.members.updateRole(ctx.orgId, ctx.role, memberId, dto.role);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Delete(":memberId")
  remove(@CurrentOrg() ctx: TenantContext, @Param("memberId") memberId: string) {
    return this.members.remove(ctx.orgId, memberId);
  }
}
