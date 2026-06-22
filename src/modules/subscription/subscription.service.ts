import { Injectable, NotFoundException } from '@nestjs/common';
import { Subscription, SubscriptionStatus } from '@prisma/client';
import { TenantContext } from '../../common/context/tenant-context.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { UpdateSubscriptionDto } from './dto/subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContext,
  ) {}

  async getCurrent(): Promise<Subscription> {
    const sub = await this.prisma.subscription.findUnique({
      where: { organizationId: this.tenant.requireOrganizationId() },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    return sub;
  }

  async update(dto: UpdateSubscriptionDto): Promise<Subscription> {
    const orgId = this.tenant.requireOrganizationId();
    return this.prisma.subscription.upsert({
      where: { organizationId: orgId },
      update: { plan: dto.plan, seats: dto.seats, status: SubscriptionStatus.ACTIVE },
      create: {
        organizationId: orgId,
        plan: dto.plan,
        seats: dto.seats ?? 3,
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }
}
