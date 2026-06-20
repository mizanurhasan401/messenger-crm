import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { StripeProvider } from "./stripe.provider";
import { BILLING_PROVIDER } from "./billing.types";

@Module({
  controllers: [BillingController],
  providers: [BillingService, { provide: BILLING_PROVIDER, useClass: StripeProvider }],
  exports: [BillingService],
})
export class BillingModule {}
