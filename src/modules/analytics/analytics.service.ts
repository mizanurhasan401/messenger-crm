import { Injectable } from '@nestjs/common';
import { CustomerStatus, OrderStatus } from '@prisma/client';
import { CACHE_KEYS } from '../../common/constants';
import { TenantContext } from '../../common/context/tenant-context.service';
import { RedisService } from '../../infra/redis/redis.service';
import { AnalyticsRepository } from './analytics.repository';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly repo: AnalyticsRepository,
    private readonly redis: RedisService,
    private readonly tenant: TenantContext,
  ) {}

  async sales() {
    const cacheKey = CACHE_KEYS.analyticsSales(this.tenant.requireOrganizationId());
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const [totalRevenue, revenueByMonth, totalOrders] = await Promise.all([
      this.repo.totalRevenue(),
      this.repo.revenueByMonth(12),
      this.repo.totalOrders(),
    ]);
    const avgOrderValue = totalOrders ? Number((totalRevenue / totalOrders).toFixed(2)) : 0;

    const result = { totalRevenue, avgOrderValue, totalOrders, revenueByMonth };
    await this.redis.set(cacheKey, result, 60);
    return result;
  }

  async orders() {
    const [total, breakdown] = await Promise.all([
      this.repo.totalOrders(),
      this.repo.ordersByStatusBreakdown(),
    ]);
    return { total, byStatus: breakdown };
  }

  async customers() {
    const [total, growth, delivered] = await Promise.all([
      this.repo.totalCustomers(),
      this.repo.customerGrowth(12),
      this.repo.countCustomersByStatus(CustomerStatus.DELIVERED),
    ]);
    // Conversion = customers who converted (ORDERED/DELIVERED) / total.
    const ordered = await this.repo.countCustomersByStatus(CustomerStatus.ORDERED);
    const conversionRate = total ? Number((((ordered + delivered) / total) * 100).toFixed(2)) : 0;

    return { total, growth, conversionRate };
  }
}
