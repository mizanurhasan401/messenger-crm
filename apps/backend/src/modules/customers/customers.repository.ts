import { Injectable } from "@nestjs/common";
import { CustomerQuery, PAGINATION } from "@messenger/shared";
import type { Prisma } from "@messenger/database";
import { TenantPrismaService } from "../../prisma/tenant-prisma.service";

/**
 * All access goes through TenantPrismaService.client, so every query is already
 * scoped to the active organizationId — no manual org filter needed here.
 */
@Injectable()
export class CustomersRepository {
  constructor(private readonly db: TenantPrismaService) {}

  async paginate(query: CustomerQuery) {
    const { page, pageSize, search, tag, sortBy, sortDir } = query;
    const where: Prisma.CustomerWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { fbName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (tag) where.tags = { some: { label: tag } };
    if (query.hasOrders) where.orders = { some: {} };

    const orderBy: Prisma.CustomerOrderByWithRelationInput = {
      [sortBy ?? "createdAt"]: sortDir,
    };

    const [data, total] = await Promise.all([
      this.db.client.customer.findMany({
        where,
        include: { tags: true, _count: { select: { orders: true } } },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.client.customer.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  findById(id: string) {
    return this.db.client.customer.findUnique({
      where: { id },
      include: { tags: true, orders: { orderBy: { createdAt: "desc" }, take: 10 } },
    });
  }

  create(data: Omit<Prisma.CustomerUncheckedCreateInput, "organizationId">) {
    // organizationId is injected by the tenant client at runtime.
    return this.db.client.customer.create({
      data: data as Prisma.CustomerUncheckedCreateInput,
      include: { tags: true },
    });
  }

  update(id: string, data: Prisma.CustomerUpdateInput) {
    return this.db.client.customer.update({ where: { id }, data, include: { tags: true } });
  }

  delete(id: string) {
    return this.db.client.customer.delete({ where: { id } });
  }

  addTag(customerId: string, label: string, color?: string) {
    return this.db.client.customerTag.create({
      data: { customerId, label, color } as Prisma.CustomerTagUncheckedCreateInput,
    });
  }

  removeTag(tagId: string) {
    return this.db.client.customerTag.delete({ where: { id: tagId } });
  }

  /** All customers for export (capped) — used by CSV export. */
  allForExport() {
    return this.db.client.customer.findMany({
      include: { tags: true },
      orderBy: { createdAt: "desc" },
      take: 10000,
    });
  }

  static defaultQuery(): CustomerQuery {
    return {
      page: PAGINATION.DEFAULT_PAGE,
      pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
      sortDir: "desc",
    } as CustomerQuery;
  }
}
