import { Injectable } from '@nestjs/common';
import { CustomerStatus, OrderStatus } from '@prisma/client';
import { CACHE_KEYS } from '../../common/constants';
import { TenantContext } from '../../common/context/tenant-context.service';
import { RedisService } from '../../infra/redis/redis.service';
import { AnalyticsRepository } from '../analytics/analytics.repository';

export interface DashboardStats {
  totalCustomers: number;
  totalOrders: number;
  revenue: number;
  newLeads: number;
  pendingOrders: number;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly analytics: AnalyticsRepository,
    private readonly redis: RedisService,
    private readonly tenant: TenantContext,
  ) {}

  async stats(): Promise<DashboardStats> {
    const cacheKey = CACHE_KEYS.dashboardStats(this.tenant.requireOrganizationId());
    const cached = await this.redis.get<DashboardStats>(cacheKey);
    if (cached) return cached;

    const [totalCustomers, totalOrders, revenue, newLeads, pendingOrders] = await Promise.all([
      this.analytics.totalCustomers(),
      this.analytics.totalOrders(),
      this.analytics.totalRevenue(),
      this.analytics.countCustomersByStatus(CustomerStatus.NEW),
      this.analytics.countOrdersByStatus(OrderStatus.PENDING),
    ]);

    const stats: DashboardStats = { totalCustomers, totalOrders, revenue, newLeads, pendingOrders };
    await this.redis.set(cacheKey, stats, 30);
    return stats;
  }
}
