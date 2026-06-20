import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, NotFoundException } from "@nestjs/common";
import {
  AddTagInput,
  CreateCustomerInput,
  CustomerQuery,
  UpdateCustomerInput,
} from "@messenger/shared";
import { Queue } from "bullmq";
import { stringify } from "csv-stringify/sync";
import type { Prisma } from "@messenger/database";
import { CsvImportJobData, JOBS, QUEUES } from "../../queue/queue.constants";
import { CustomersRepository } from "./customers.repository";

@Injectable()
export class CustomersService {
  constructor(
    private readonly repo: CustomersRepository,
    @InjectQueue(QUEUES.CSV_IMPORT) private readonly importQueue: Queue<CsvImportJobData>,
  ) {}

  list(query: CustomerQuery) {
    return this.repo.paginate(query);
  }

  async get(id: string) {
    const customer = await this.repo.findById(id);
    if (!customer) throw new NotFoundException("Customer not found");
    return customer;
  }

  async create(userId: string, input: CreateCustomerInput) {
    const customer = await this.repo.create({
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: (input.address ?? undefined) as Prisma.InputJsonValue | undefined,
      fbName: input.fbName ?? null,
      fbProfileUrl: input.fbProfileUrl ?? null,
      source: input.source ?? "manual",
      createdBy: userId,
    });

    // Tags are created as top-level rows so the tenant client scopes each to the org
    // (the $extends layer does not reach nested relation writes).
    if (input.tags?.length) {
      for (const label of input.tags) {
        await this.repo.addTag(customer.id, label);
      }
      return this.get(customer.id);
    }
    return customer;
  }

  async update(id: string, input: UpdateCustomerInput) {
    await this.get(id);
    const data: Prisma.CustomerUpdateInput = {
      name: input.name,
      phone: input.phone,
      email: input.email,
      address: (input.address ?? undefined) as Prisma.InputJsonValue | undefined,
      fbName: input.fbName,
      fbProfileUrl: input.fbProfileUrl,
      source: input.source,
    };
    return this.repo.update(id, data);
  }

  async remove(id: string) {
    await this.get(id);
    await this.repo.delete(id);
    return { deleted: true };
  }

  async addTag(customerId: string, input: AddTagInput) {
    await this.get(customerId);
    return this.repo.addTag(customerId, input.label, input.color);
  }

  removeTag(tagId: string) {
    return this.repo.removeTag(tagId);
  }

  /** Enqueue a CSV import job (parsed asynchronously by the processor). */
  async importCsv(orgId: string, userId: string, csv: string) {
    const job = await this.importQueue.add(JOBS.IMPORT_CUSTOMERS, {
      organizationId: orgId,
      userId,
      csv,
    });
    return { jobId: job.id, status: "queued" };
  }

  /** Synchronous CSV export of the current org's customers. */
  async exportCsv(): Promise<string> {
    const customers = await this.repo.allForExport();
    const rows = customers.map((c) => ({
      name: c.name,
      phone: c.phone ?? "",
      email: c.email ?? "",
      fbName: c.fbName ?? "",
      fbProfileUrl: c.fbProfileUrl ?? "",
      tags: c.tags.map((t) => t.label).join("|"),
      createdAt: c.createdAt.toISOString(),
    }));
    return stringify(rows, {
      header: true,
      columns: ["name", "phone", "email", "fbName", "fbProfileUrl", "tags", "createdAt"],
    });
  }
}
