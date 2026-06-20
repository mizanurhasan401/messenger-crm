import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { parse } from "csv-parse/sync";
import type { Job } from "bullmq";
import { NotificationType } from "@messenger/shared";
import type { Prisma } from "@messenger/database";
import { PrismaService } from "../../prisma/prisma.service";
import { tenantClientForJob } from "../../prisma/tenant-prisma.service";
import { CsvImportJobData, QUEUES } from "../../queue/queue.constants";

interface CsvRow {
  name?: string;
  phone?: string;
  email?: string;
  fbName?: string;
  fbProfileUrl?: string;
  tags?: string;
}

/**
 * Parses an uploaded CSV and bulk-inserts customers for the job's organization.
 * Runs OUTSIDE the HTTP request, so it builds an org-scoped client explicitly
 * from the job payload (no AsyncLocalStorage available here). Dedupes against
 * existing customers by (phone | fbProfileUrl) within the org.
 */
@Processor(QUEUES.CSV_IMPORT)
export class CsvImportProcessor extends WorkerHost {
  private readonly logger = new Logger(CsvImportProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<CsvImportJobData>): Promise<{ imported: number; skipped: number }> {
    const { organizationId, userId, csv } = job.data;
    const db = tenantClientForJob(this.prisma, organizationId);

    const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true }) as CsvRow[];

    const existing = await db.customer.findMany({
      select: { phone: true, fbProfileUrl: true },
    });
    const seenPhones = new Set(existing.map((e) => e.phone).filter(Boolean) as string[]);
    const seenUrls = new Set(existing.map((e) => e.fbProfileUrl).filter(Boolean) as string[]);

    let imported = 0;
    let skipped = 0;
    const batch: Array<{
      name: string;
      phone: string | null;
      email: string | null;
      fbName: string | null;
      fbProfileUrl: string | null;
      source: string;
      createdBy: string;
    }> = [];

    for (const row of rows) {
      const name = row.name?.trim();
      if (!name) {
        skipped += 1;
        continue;
      }
      const phone = row.phone?.trim() || null;
      const url = row.fbProfileUrl?.trim() || null;
      if ((phone && seenPhones.has(phone)) || (url && seenUrls.has(url))) {
        skipped += 1;
        continue;
      }
      if (phone) seenPhones.add(phone);
      if (url) seenUrls.add(url);

      batch.push({
        name,
        phone,
        email: row.email?.trim() || null,
        fbName: row.fbName?.trim() || null,
        fbProfileUrl: url,
        source: "import",
        createdBy: userId,
      });
    }

    // Insert in chunks to keep memory + statement size bounded.
    const CHUNK = 500;
    for (let i = 0; i < batch.length; i += CHUNK) {
      const slice = batch.slice(i, i + CHUNK);
      const res = await db.customer.createMany({
        data: slice as unknown as Prisma.CustomerCreateManyInput[],
        skipDuplicates: true,
      });
      imported += res.count;
      await job.updateProgress(Math.round(((i + slice.length) / Math.max(batch.length, 1)) * 100));
    }

    await db.notification.create({
      data: {
        userId,
        type: NotificationType.SYSTEM,
        title: "CSV import finished",
        body: `${imported} imported, ${skipped} skipped`,
      } as Prisma.NotificationUncheckedCreateInput,
    });

    this.logger.log(`Import ${job.id}: ${imported} imported, ${skipped} skipped`);
    return { imported, skipped };
  }
}
