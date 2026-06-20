import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { FollowupStatus, NotificationType } from "@messenger/shared";
import type { Prisma } from "@messenger/database";
import type { Job } from "bullmq";
import { PrismaService } from "../../prisma/prisma.service";
import { tenantClientForJob } from "../../prisma/tenant-prisma.service";
import { FollowupReminderJobData, QUEUES } from "../../queue/queue.constants";

/**
 * Fires when a follow-up's due time arrives: if it's still pending, creates a
 * notification for the assignee. Org-scoped via the job payload (no HTTP context).
 */
@Processor(QUEUES.FOLLOWUP_REMINDER)
export class FollowupReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(FollowupReminderProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<FollowupReminderJobData>): Promise<void> {
    const { organizationId, followupId, userId } = job.data;
    const db = tenantClientForJob(this.prisma, organizationId);

    const followup = await db.followup.findUnique({
      where: { id: followupId },
      include: { customer: { select: { name: true } } },
    });
    if (!followup || followup.status !== FollowupStatus.PENDING) return;

    await db.notification.create({
      data: {
        userId,
        type: NotificationType.FOLLOWUP_DUE,
        title: "Follow-up due",
        body: `Follow up with ${followup.customer.name}`,
        data: { followupId },
      } as unknown as Prisma.NotificationUncheckedCreateInput,
    });
    this.logger.log(`Reminder fired for followup ${followupId}`);
  }
}
