import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, NotFoundException } from "@nestjs/common";
import {
  CreateFollowupInput,
  FollowupQuery,
  FollowupStatus,
  UpdateFollowupInput,
} from "@messenger/shared";
import { Queue } from "bullmq";
import type { Prisma } from "@messenger/database";
import { TenantPrismaService } from "../../prisma/tenant-prisma.service";
import { FollowupReminderJobData, JOBS, QUEUES } from "../../queue/queue.constants";

@Injectable()
export class FollowupsService {
  constructor(
    private readonly db: TenantPrismaService,
    @InjectQueue(QUEUES.FOLLOWUP_REMINDER)
    private readonly queue: Queue<FollowupReminderJobData>,
  ) {}

  list(orgId: string, query: FollowupQuery) {
    const { page, pageSize, status, scope, assignedTo } = query;
    const where: Prisma.FollowupWhereInput = {};
    if (status) where.status = status;
    else if (scope === "upcoming") where.status = { in: [FollowupStatus.PENDING, FollowupStatus.SNOOZED] };
    else if (scope === "completed") where.status = FollowupStatus.COMPLETED;
    if (assignedTo) where.assignedTo = assignedTo;

    return Promise.all([
      this.db.client.followup.findMany({
        where,
        include: { customer: { select: { id: true, name: true, phone: true } } },
        orderBy: { dueAt: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.client.followup.count({ where }),
    ]).then(([data, total]) => ({
      data,
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    }));
  }

  async create(orgId: string, userId: string, input: CreateFollowupInput) {
    const followup = await this.db.client.followup.create({
      data: {
        customerId: input.customerId,
        assignedTo: input.assignedTo ?? userId,
        dueAt: input.dueAt,
        note: input.note,
        createdBy: userId,
      } as Prisma.FollowupUncheckedCreateInput,
    });

    // Schedule a delayed reminder job for the due time.
    const delay = Math.max(0, input.dueAt.getTime() - Date.now());
    const job = await this.queue.add(
      JOBS.SEND_FOLLOWUP_REMINDER,
      { organizationId: orgId, followupId: followup.id, userId: followup.assignedTo },
      { delay, removeOnComplete: true },
    );
    return this.db.client.followup.update({
      where: { id: followup.id },
      data: { reminderJobId: job.id },
    });
  }

  async update(id: string, input: UpdateFollowupInput) {
    await this.getOrThrow(id);
    const completedAt = input.status === FollowupStatus.COMPLETED ? new Date() : undefined;
    return this.db.client.followup.update({
      where: { id },
      data: { ...input, completedAt },
    });
  }

  async complete(id: string) {
    await this.getOrThrow(id);
    return this.db.client.followup.update({
      where: { id },
      data: { status: FollowupStatus.COMPLETED, completedAt: new Date() },
    });
  }

  private async getOrThrow(id: string) {
    const f = await this.db.client.followup.findUnique({ where: { id } });
    if (!f) throw new NotFoundException("Follow-up not found");
    return f;
  }
}
