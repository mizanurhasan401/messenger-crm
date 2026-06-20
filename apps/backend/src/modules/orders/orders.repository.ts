import { Injectable } from "@nestjs/common";
import { OrderQuery } from "@messenger/shared";
import type { Prisma } from "@messenger/database";
import { TenantPrismaService } from "../../prisma/tenant-prisma.service";

@Injectable()
export class OrdersRepository {
  constructor(private readonly db: TenantPrismaService) {}

  async paginate(query: OrderQuery) {
    const { page, pageSize, search, status, customerId, sortBy, sortDir } = query;
    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.db.client.order.findMany({
        where,
        include: { customer: { select: { id: true, name: true, phone: true } } },
        orderBy: { [sortBy ?? "createdAt"]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.client.order.count({ where }),
    ]);

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    };
  }

  findById(id: string) {
    return this.db.client.order.findUnique({
      where: { id },
      include: {
        customer: true,
        timeline: { orderBy: { createdAt: "asc" } },
        notes: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  countForOrg() {
    return this.db.client.order.count();
  }

  create(data: Omit<Prisma.OrderUncheckedCreateInput, "organizationId">) {
    return this.db.client.order.create({
      data: data as Prisma.OrderUncheckedCreateInput,
      include: { timeline: true },
    });
  }

  update(id: string, data: Prisma.OrderUpdateInput) {
    return this.db.client.order.update({ where: { id }, data });
  }
}
