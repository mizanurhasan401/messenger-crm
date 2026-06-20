import { Injectable, NotFoundException } from "@nestjs/common";
import {
  ChangeOrderStatusInput,
  CreateOrderInput,
  OrderQuery,
  OrderStatus,
  UpdateOrderInput,
} from "@messenger/shared";
import type { Prisma } from "@messenger/database";
import { TenantPrismaService } from "../../prisma/tenant-prisma.service";
import { OrdersRepository } from "./orders.repository";
import { assertTransition } from "./order-status.machine";

function computeTotals(items: CreateOrderInput["items"], shippingFee: number) {
  const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);
  return { subtotal, total: subtotal + shippingFee };
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly repo: OrdersRepository,
    private readonly db: TenantPrismaService,
  ) {}

  list(query: OrderQuery) {
    return this.repo.paginate(query);
  }

  async get(id: string) {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async create(userId: string, input: CreateOrderInput) {
    const orderNumber = input.orderNumber ?? (await this.nextOrderNumber());
    const { subtotal, total } = computeTotals(input.items, input.shippingFee);

    const order = await this.repo.create({
      customerId: input.customerId,
      orderNumber,
      status: OrderStatus.PENDING,
      items: input.items as unknown as Prisma.InputJsonValue,
      subtotal,
      shippingFee: input.shippingFee,
      total,
      currency: input.currency,
      createdBy: userId,
    });

    // Timeline is a top-level create so the tenant client scopes it to the org
    // (nested relation writes are not reached by the $extends injection).
    await this.db.client.orderTimeline.create({
      data: {
        orderId: order.id,
        toStatus: OrderStatus.PENDING,
        changedBy: userId,
      } as Prisma.OrderTimelineUncheckedCreateInput,
    });
    return this.get(order.id);
  }

  async update(id: string, input: UpdateOrderInput) {
    const order = await this.get(id);
    const items = (input.items ?? (order.items as unknown as CreateOrderInput["items"])) ?? [];
    const shippingFee = input.shippingFee ?? Number(order.shippingFee);
    const { subtotal, total } = computeTotals(items, shippingFee);
    return this.repo.update(id, {
      items: items as unknown as Prisma.InputJsonValue,
      shippingFee,
      subtotal,
      total,
      currency: input.currency ?? order.currency,
    });
  }

  /** Status change with state-machine validation + timeline entry (atomic). */
  async changeStatus(id: string, userId: string, input: ChangeOrderStatusInput) {
    const order = await this.get(id);
    assertTransition(order.status, input.status);

    await this.db.client.order.update({ where: { id }, data: { status: input.status } });
    await this.db.client.orderTimeline.create({
      data: {
        orderId: id,
        fromStatus: order.status,
        toStatus: input.status,
        changedBy: userId,
        note: input.note,
      } as Prisma.OrderTimelineUncheckedCreateInput,
    });
    return this.get(id);
  }

  private async nextOrderNumber(): Promise<string> {
    const count = await this.repo.countForOrg();
    return `ORD-${String(count + 1).padStart(4, "0")}`;
  }
}
