import { OrderStatus, Role } from "./enums";

/** Default + max page sizes for paginated list endpoints. */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Allowed order-status transitions. The backend `order-status.machine.ts`
 * enforces this; the dashboard uses it to render only valid next-status options.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  RETURNED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

/** Role hierarchy weight — higher can manage lower. */
export const ROLE_RANK: Record<Role, number> = {
  OWNER: 40,
  MANAGER: 30,
  AGENT: 20,
  VIEWER: 10,
};

/** Header the extension/dashboard send to select the active tenant. */
export const ORG_HEADER = "x-organization-id";
