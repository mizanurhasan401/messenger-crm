import { SubscriptionPlan } from "@messenger/shared";

/**
 * Provider-agnostic billing interface. Default implementation targets Stripe;
 * a BDT-friendly provider (SSLCommerz/manual) can implement the same contract.
 */
export interface BillingProvider {
  createCheckout(params: {
    organizationId: string;
    plan: SubscriptionPlan;
    seats: number;
  }): Promise<{ url: string }>;

  handleWebhook(rawBody: Buffer, signature: string): Promise<BillingEvent | null>;
}

export interface BillingEvent {
  type: "subscription.active" | "subscription.past_due" | "subscription.cancelled";
  organizationId: string;
  providerCustomerId?: string;
  providerSubId?: string;
  plan?: SubscriptionPlan;
  currentPeriodEnd?: Date;
}

export const BILLING_PROVIDER = "BILLING_PROVIDER";
