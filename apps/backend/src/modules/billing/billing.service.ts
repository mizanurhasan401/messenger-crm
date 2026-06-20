import { Inject, Injectable } from "@nestjs/common";
import { SubscriptionPlan } from "@messenger/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { TenantPrismaService } from "../../prisma/tenant-prisma.service";
import { BillingEvent, BillingProvider, BILLING_PROVIDER } from "./billing.types";

@Injectable()
export class BillingService {
  constructor(
    private readonly db: TenantPrismaService,
    private readonly base: PrismaService,
    @Inject(BILLING_PROVIDER) private readonly provider: BillingProvider,
  ) {}

  /** Current org's subscription (org-scoped). */
  getSubscription() {
    return this.db.client.subscription.findFirst();
  }

  async checkout(orgId: string, plan: SubscriptionPlan, seats: number) {
    return this.provider.createCheckout({ organizationId: orgId, plan, seats });
  }

  /** Webhook entrypoint — runs outside tenant context, so it uses the base client. */
  async applyWebhook(rawBody: Buffer, signature: string): Promise<{ handled: boolean }> {
    const event = await this.provider.handleWebhook(rawBody, signature);
    if (!event) return { handled: false };
    await this.reconcile(event);
    return { handled: true };
  }

  private async reconcile(event: BillingEvent) {
    const statusMap = {
      "subscription.active": "ACTIVE",
      "subscription.past_due": "PAST_DUE",
      "subscription.cancelled": "CANCELLED",
    } as const;

    await this.base.subscription.update({
      where: { organizationId: event.organizationId },
      data: {
        status: statusMap[event.type],
        plan: event.plan ?? undefined,
        providerCustomerId: event.providerCustomerId,
        providerSubId: event.providerSubId,
        currentPeriodEnd: event.currentPeriodEnd,
      },
    });
  }
}
