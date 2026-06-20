import { Body, Controller, Get, Headers, Post, Req } from "@nestjs/common";
import { Role, SubscriptionPlan } from "@messenger/shared";
import type { Request } from "express";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { TenantContext } from "../../common/context/tenant-context";
import { BillingService } from "./billing.service";

@Controller("billing")
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get("subscription")
  subscription() {
    return this.billing.getSubscription();
  }

  @Roles(Role.OWNER)
  @Post("checkout")
  checkout(
    @CurrentOrg() ctx: TenantContext,
    @Body() body: { plan: SubscriptionPlan; seats?: number },
  ) {
    return this.billing.checkout(ctx.orgId, body.plan, body.seats ?? 1);
  }

  /** Provider webhook — public + raw body verified inside the provider. */
  @Public()
  @Post("webhook")
  webhook(@Req() req: Request, @Headers("stripe-signature") signature: string) {
    const raw = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body));
    return this.billing.applyWebhook(raw, signature ?? "");
  }
}
