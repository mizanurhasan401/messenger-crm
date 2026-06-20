import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import {
  createQuickReplySchema,
  CreateQuickReplyInput,
  Role,
  updateQuickReplySchema,
  UpdateQuickReplyInput,
} from "@messenger/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodBody } from "../../common/pipes/zod-validation.pipe";
import { QuickRepliesService } from "./quick-replies.service";

@Controller("quick-replies")
export class QuickRepliesController {
  constructor(private readonly quickReplies: QuickRepliesService) {}

  @Get()
  list() {
    return this.quickReplies.list();
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.AGENT)
  @Post()
  create(
    @CurrentUser() userId: string,
    @Body(new ZodBody(createQuickReplySchema)) dto: CreateQuickReplyInput,
  ) {
    return this.quickReplies.create(userId, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.AGENT)
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodBody(updateQuickReplySchema)) dto: UpdateQuickReplyInput,
  ) {
    return this.quickReplies.update(id, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.quickReplies.remove(id);
  }
}
