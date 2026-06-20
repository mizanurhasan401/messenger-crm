import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import {
  createNoteSchema,
  CreateNoteInput,
  Role,
  updateNoteSchema,
  UpdateNoteInput,
} from "@messenger/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodBody } from "../../common/pipes/zod-validation.pipe";
import { NotesService } from "./notes.service";

@Controller("notes")
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  list(@Query("customerId") customerId?: string, @Query("orderId") orderId?: string) {
    return this.notes.list({ customerId, orderId });
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.AGENT)
  @Post()
  create(@CurrentUser() userId: string, @Body(new ZodBody(createNoteSchema)) dto: CreateNoteInput) {
    return this.notes.create(userId, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.AGENT)
  @Patch(":id")
  update(@Param("id") id: string, @Body(new ZodBody(updateNoteSchema)) dto: UpdateNoteInput) {
    return this.notes.update(id, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.AGENT)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.notes.remove(id);
  }
}
