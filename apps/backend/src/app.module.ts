import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { validateEnv } from "./config/env.validation";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { QueueModule } from "./queue/queue.module";
import { HealthController } from "./health/health.controller";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { NotesModule } from "./modules/notes/notes.module";
import { FollowupsModule } from "./modules/followups/followups.module";
import { QuickRepliesModule } from "./modules/quick-replies/quick-replies.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";
import { BillingModule } from "./modules/billing/billing.module";
import { AuthGuard } from "./common/guards/auth.guard";
import { OrgGuard } from "./common/guards/org.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { RequestContextMiddleware } from "./common/middleware/request-context.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    QueueModule,
    AuthModule,
    AuditLogsModule,
    OrganizationsModule,
    CustomersModule,
    OrdersModule,
    NotesModule,
    FollowupsModule,
    QuickRepliesModule,
    NotificationsModule,
    AnalyticsModule,
    BillingModule,
  ],
  controllers: [HealthController],
  providers: [
    // Guard order matters: Auth → Org → Roles.
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: OrgGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes("*");
  }
}
