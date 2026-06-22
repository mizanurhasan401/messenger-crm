import { Injectable } from '@nestjs/common';
import { CustomerStatus, OrderStatus } from '@prisma/client';
import { TenantContext } from '../../common/context/tenant-context.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PrismaService } from '../../infra/prisma/prisma.service';

export interface MonthlyBucket {
  month: string; // YYYY-MM
  value: number;
}

/**
 * Read-only analytic aggregations, all tenant-scoped. Heavier time-series
 * queries use raw SQL with parameterized organization id.
 */
@Injectable()
export class AnalyticsRepository extends BaseRepository {
  constructor(
    private readonly prisma: PrismaService,
    tenant: TenantContext,
  ) {
    super(tenant);
  }

  totalCustomers(): Promise<number> {
    return this.prisma.customer.count({ where: { organizationId: this.orgId } });
  }

  totalOrders(): Promise<number> {
    return this.prisma.order.count({ where: { organizationId: this.orgId } });
  }

  async totalRevenue(): Promise<number> {
    const res = await this.prisma.order.aggregate({
      where: { organizationId: this.orgId, status: { not: OrderStatus.CANCELLED } },
      _sum: { total: true },
    });
    return Number(res._sum.total ?? 0);
  }

  countCustomersByStatus(status: CustomerStatus): Promise<number> {
    return this.prisma.customer.count({ where: { organizationId: this.orgId, status } });
  }

  countOrdersByStatus(status: OrderStatus): Promise<number> {
    return this.prisma.order.count({ where: { organizationId: this.orgId, status } });
  }

  /** Revenue grouped by calendar month for the last N months. */
  async revenueByMonth(months = 12): Promise<MonthlyBucket[]> {
    const rows = await this.prisma.$queryRaw<Array<{ month: Date; value: number }>>`
      SELECT date_trunc('month', "created_at") AS month,
             COALESCE(SUM("total"), 0)::float AS value
      FROM "orders"
      WHERE "organization_id" = ${this.orgId}::uuid
        AND "status" <> 'CANCELLED'
        AND "created_at" >= (now() - (${months} || ' months')::interval)
      GROUP BY 1
      ORDER BY 1 ASC`;
    return rows.map((r) => ({ month: r.month.toISOString().slice(0, 7), value: Number(r.value) }));
  }

  /** New customers per month (growth) for the last N months. */
  async customerGrowth(months = 12): Promise<MonthlyBucket[]> {
    const rows = await this.prisma.$queryRaw<Array<{ month: Date; value: bigint }>>`
      SELECT date_trunc('month', "created_at") AS month,
             COUNT(*)::int AS value
      FROM "customers"
      WHERE "organization_id" = ${this.orgId}::uuid
        AND "created_at" >= (now() - (${months} || ' months')::interval)
      GROUP BY 1
      ORDER BY 1 ASC`;
    return rows.map((r) => ({ month: r.month.toISOString().slice(0, 7), value: Number(r.value) }));
  }

  async ordersByStatusBreakdown(): Promise<Record<string, number>> {
    const grouped = await this.prisma.order.groupBy({
      by: ['status'],
      where: { organizationId: this.orgId },
      _count: { _all: true },
    });
    return Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));
  }
}
