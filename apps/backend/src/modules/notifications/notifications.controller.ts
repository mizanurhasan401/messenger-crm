import { Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() userId: string, @Query("unread") unread?: string) {
    return this.notifications.list(userId, unread === "true");
  }

  @Get("unread-count")
  unreadCount(@CurrentUser() userId: string) {
    return this.notifications.unreadCount(userId);
  }

  @Patch("read-all")
  markAllRead(@CurrentUser() userId: string) {
    return this.notifications.markAllRead(userId);
  }

  @Patch(":id/read")
  markRead(@CurrentUser() userId: string, @Param("id") id: string) {
    return this.notifications.markRead(userId, id);
  }
}
