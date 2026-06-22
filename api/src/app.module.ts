import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ClsModule } from 'nestjs-cls';
import { randomUUID } from 'crypto';

import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { CLS_KEYS } from './common/constants';
import { CommonModule } from './common/common.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

// Infra
import { PrismaModule } from './infra/prisma/prisma.module';
import { RedisModule } from './infra/redis/redis.module';
import { QueueModule } from './infra/queue/queue.module';
import { StorageModule } from './infra/storage/storage.module';
import { MailModule } from './infra/mail/mail.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { CustomerModule } from './modules/customer/customer.module';
import { TagModule } from './modules/tag/tag.module';
import { NoteModule } from './modules/note/note.module';
import { OrderModule } from './modules/order/order.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { FileModule } from './modules/file/file.module';
import { ExtensionModule } from './modules/extension/extension.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validate: validateEnv,
    }),

    // AsyncLocalStorage — seeds requestId, and lets guards hydrate tenant ctx.
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req) => {
          cls.set(CLS_KEYS.REQUEST_ID, req.headers['x-request-id'] ?? randomUUID());
        },
      },
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: (config.get<number>('throttle.ttl') ?? 60) * 1000,
            limit: config.get<number>('throttle.limit') ?? 120,
          },
        ],
      }),
    }),

    ScheduleModule.forRoot(),

    // Cross-cutting (TenantContext, etc.)
    CommonModule,

    // Infra (all @Global)
    PrismaModule,
    RedisModule,
    QueueModule,
    StorageModule,
    MailModule,

    // Domain
    AuthModule,
    UserModule,
    OrganizationModule,
    CustomerModule,
    TagModule,
    NoteModule,
    OrderModule,
    DashboardModule,
    AnalyticsModule,
    SubscriptionModule,
    NotificationModule,
    AuditLogModule,
    FileModule,
    ExtensionModule,
    HealthModule,
  ],
  providers: [
    // ---- Global guards (order matters: Auth → Tenant → Roles → Permissions)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },

    // ---- Global interceptors & filter
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
