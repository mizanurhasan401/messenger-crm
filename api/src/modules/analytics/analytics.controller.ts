import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permission.enum';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('sales')
  @RequirePermissions(Permission.ANALYTICS_READ)
  @ApiOperation({ summary: 'Sales analytics — revenue, AOV, revenue by month' })
  sales() {
    return this.analytics.sales();
  }

  @Get('orders')
  @RequirePermissions(Permission.ANALYTICS_READ)
  @ApiOperation({ summary: 'Order analytics — totals and status breakdown' })
  orders() {
    return this.analytics.orders();
  }

  @Get('customers')
  @RequirePermissions(Permission.ANALYTICS_READ)
  @ApiOperation({ summary: 'Customer analytics — growth and conversion rate' })
  customers() {
    return this.analytics.customers();
  }
}
