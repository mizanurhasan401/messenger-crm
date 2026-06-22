import { Injectable } from '@nestjs/common';
import { Notification, NotificationType } from '@prisma/client';
import { buildPaginationMeta, PaginatedResult, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { NotificationRepository } from './notification.repository';

export interface CreateNotificationInput {
  userId?: string; // null/undefined = org-wide
  type?: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationService {
  constructor(private readonly repo: NotificationRepository) {}

  /** Programmatic creation used by other modules (orders, billing, etc.). */
  create(input: CreateNotificationInput): Promise<Notification> {
    return this.repo.create({
      userId: input.userId,
      type: input.type ?? NotificationType.SYSTEM,
      title: input.title,
      body: input.body,
      data: input.data as object,
    });
  }

  async list(userId: string, query: PaginationQueryDto): Promise<PaginatedResult<Notification>> {
    const [data, total] = await this.repo.listForUser(userId, query.skip, query.limit);
    return { data, meta: buildPaginationMeta(total, query.page, query.limit) };
  }

  unreadCount(userId: string): Promise<number> {
    return this.repo.countUnread(userId);
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.repo.markRead(id, userId);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo.markAllRead(userId);
  }
}
