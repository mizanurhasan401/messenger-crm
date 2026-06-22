import { Injectable } from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';
import { TenantContext } from '../../common/context/tenant-context.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class NotificationRepository extends BaseRepository {
  constructor(
    private readonly prisma: PrismaService,
    tenant: TenantContext,
  ) {
    super(tenant);
  }

  create(data: Omit<Prisma.NotificationUncheckedCreateInput, 'organizationId'>): Promise<Notification> {
    return this.prisma.notification.create({ data: { ...data, organizationId: this.orgId } });
  }

  async listForUser(userId: string, skip: number, take: number): Promise<[Notification[], number]> {
    const where: Prisma.NotificationWhereInput = {
      organizationId: this.orgId,
      OR: [{ userId }, { userId: null }],
    };
    return this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where }),
    ]);
  }

  countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { organizationId: this.orgId, isRead: false, OR: [{ userId }, { userId: null }] },
    });
  }

  markRead(id: string, userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.notification.updateMany({
      where: { id, organizationId: this.orgId, OR: [{ userId }, { userId: null }] },
      data: { isRead: true, readAt: new Date() },
    });
  }

  markAllRead(userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.notification.updateMany({
      where: { organizationId: this.orgId, isRead: false, OR: [{ userId }, { userId: null }] },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
