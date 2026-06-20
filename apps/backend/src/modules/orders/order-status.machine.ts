import { BadRequestException } from "@nestjs/common";
import { canTransition, OrderStatus, ORDER_STATUS_TRANSITIONS } from "@messenger/shared";

/** Throws unless `from → to` is an allowed order-status transition. */
export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (from === to) {
    throw new BadRequestException(`Order is already ${to}`);
  }
  if (!canTransition(from, to)) {
    const allowed = ORDER_STATUS_TRANSITIONS[from].join(", ") || "none";
    throw new BadRequestException(`Cannot move ${from} → ${to}. Allowed: ${allowed}`);
  }
}
