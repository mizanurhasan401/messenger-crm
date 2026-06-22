import { Injectable } from '@nestjs/common';
import { Order, OrderStatus, Prisma } from '@prisma/client';
import { TenantContext } from '../../common/context/tenant-context.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { QueryOrderDto } from './dto/query-order.dto';

const orderInclude = {
  customer: { select: { id: true, name: true, phone: true, facebookName: true } },
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrderRepository extends BaseRepository {
  constructor(
    private readonly prisma: PrismaService,
    tenant: TenantContext,
  ) {
    super(tenant);
  }

  customerInOrg(customerId: string) {
    return this.prisma.customer.findFirst({
      where: { id: customerId, organizationId: this.orgId },
      select: { id: true },
    });
  }

  create(data: Omit<Prisma.OrderUncheckedCreateInput, 'organizationId'>): Promise<Order> {
    return this.prisma.order.create({ data: { ...data, organizationId: this.orgId } });
  }

  findById(id: string) {
    return this.prisma.order.findFirst({
      where: { id, organizationId: this.orgId },
      include: orderInclude,
    });
  }

  update(id: string, data: Prisma.OrderUncheckedUpdateInput): Promise<Prisma.BatchPayload> {
    return this.prisma.order.updateMany({ where: { id, organizationId: this.orgId }, data });
  }

  delete(id: string): Promise<Prisma.BatchPayload> {
    return this.prisma.order.deleteMany({ where: { id, organizationId: this.orgId } });
  }

  setStatus(id: string, status: OrderStatus): Promise<Prisma.BatchPayload> {
    return this.prisma.order.updateMany({
      where: { id, organizationId: this.orgId },
      data: { status },
    });
  }

  async paginate(query: QueryOrderDto): Promise<[Order[], number]> {
    const where: Prisma.OrderWhereInput = {
      organizationId: this.orgId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.search
        ? {
            OR: [
              { orderNumber: { contains: query.search, mode: 'insensitive' } },
              { productName: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.order.count({ where }),
    ]);
  }

  /** Atomic, gap-tolerant per-tenant order number generator. */
  async nextOrderNumber(): Promise<string> {
    const count = await this.prisma.order.count({ where: { organizationId: this.orgId } });
    return `ORD-${String(count + 1).padStart(5, '0')}`;
  }
}
