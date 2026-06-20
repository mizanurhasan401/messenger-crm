import { Controller, Get, Query } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get("summary")
  summary() {
    return this.analytics.summary();
  }

  @Get("recent")
  recent() {
    return this.analytics.recent();
  }

  @Get("monthly-revenue")
  monthlyRevenue(@Query("months") months?: string) {
    return this.analytics.monthlyRevenue(months ? Number(months) : undefined);
  }

  @Get("customer-growth")
  customerGrowth(@Query("months") months?: string) {
    return this.analytics.customerGrowth(months ? Number(months) : undefined);
  }
}
