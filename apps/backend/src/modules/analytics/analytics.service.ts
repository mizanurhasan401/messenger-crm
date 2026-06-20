import { Injectable } from "@nestjs/common";
import { OrderStatus } from "@messenger/shared";
import { TenantPrismaService } from "../../prisma/tenant-prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly db: TenantPrismaService) {}

  /** Dashboard-home widgets. */
  async summary() {
    const c = this.db.client;
    const [totalCustomers, totalOrders, pendingOrders, deliveredOrders, revenueAgg] =
      await Promise.all([
        c.customer.count(),
        c.order.count(),
        c.order.count({ where: { status: OrderStatus.PENDING } }),
        c.order.count({ where: { status: OrderStatus.DELIVERED } }),
        c.order.aggregate({
          _sum: { total: true },
          where: { status: OrderStatus.DELIVERED },
        }),
      ]);

    return {
      totalCustomers,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      revenue: Number(revenueAgg._sum.total ?? 0),
      conversionRate: totalOrders ? Math.round((deliveredOrders / totalOrders) * 100) : 0,
    };
  }

  /** Recent customers + orders for the home feed. */
  async recent() {
    const c = this.db.client;
    const [customers, orders] = await Promise.all([
      c.customer.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      c.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { customer: { select: { name: true } } },
      }),
    ]);
    return { customers, orders };
  }

  /**
   * Monthly revenue for the last N months (delivered orders), grouped in JS to
   * stay portable. For very large datasets switch to a raw SQL date_trunc query
   * (remember to include organizationId — raw SQL bypasses tenant scoping).
   */
  async monthlyRevenue(months = 6) {
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1), 1);
    since.setHours(0, 0, 0, 0);

    const orders = await this.db.client.order.findMany({
      where: { status: OrderStatus.DELIVERED, createdAt: { gte: since } },
      select: { total: true, createdAt: true },
    });

    const buckets = new Map<string, number>();
    for (let i = 0; i < months; i += 1) {
      const d = new Date(since);
      d.setMonth(since.getMonth() + i);
      buckets.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
    }
    for (const o of orders) {
      const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, "0")}`;
      buckets.set(key, (buckets.get(key) ?? 0) + Number(o.total));
    }
    return Array.from(buckets.entries()).map(([month, revenue]) => ({ month, revenue }));
  }

  /** Customer growth (count by month, last N months). */
  async customerGrowth(months = 6) {
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1), 1);
    since.setHours(0, 0, 0, 0);
    const customers = await this.db.client.customer.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });
    const buckets = new Map<string, number>();
    for (const cu of customers) {
      const key = `${cu.createdAt.getFullYear()}-${String(cu.createdAt.getMonth() + 1).padStart(2, "0")}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));
  }
}
