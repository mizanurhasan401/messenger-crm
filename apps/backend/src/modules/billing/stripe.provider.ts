import { Injectable, Logger } from "@nestjs/common";
import { SubscriptionPlan } from "@messenger/shared";
import { BillingEvent, BillingProvider } from "./billing.types";

/**
 * Stripe implementation stub. Wire the real Stripe SDK here in production:
 * create Checkout Sessions and verify webhook signatures with STRIPE_WEBHOOK_SECRET.
 * Kept dependency-free so the platform builds without Stripe keys in dev.
 */
@Injectable()
export class StripeProvider implements BillingProvider {
  private readonly logger = new Logger(StripeProvider.name);

  async createCheckout(params: {
    organizationId: string;
    plan: SubscriptionPlan;
    seats: number;
  }): Promise<{ url: string }> {
    this.logger.warn(`[billing] stub checkout for org ${params.organizationId} (${params.plan})`);
    // Real impl: stripe.checkout.sessions.create({...}); return session.url
    return { url: `https://billing.example.com/checkout?org=${params.organizationId}&plan=${params.plan}` };
  }

  async handleWebhook(_rawBody: Buffer, _signature: string): Promise<BillingEvent | null> {
    // Real impl: stripe.webhooks.constructEvent(rawBody, signature, secret) then map.
    return null;
  }
}
