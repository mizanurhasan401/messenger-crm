import { Injectable } from "@nestjs/common";
import { TenantPrismaService } from "../../prisma/tenant-prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly db: TenantPrismaService) {}

  list(userId: string, unreadOnly = false) {
    return this.db.client.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  unreadCount(userId: string) {
    return this.db.client.notification
      .count({ where: { userId, readAt: null } })
      .then((count) => ({ count }));
  }

  async markRead(userId: string, id: string) {
    await this.db.client.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.db.client.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }
}
