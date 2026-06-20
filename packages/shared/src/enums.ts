/**
 * Canonical enums for the platform. These are the single source of truth shared
 * by backend, dashboard and extension. The Prisma schema MIRRORS these values;
 * `enums.test.ts` (plus a CI check) asserts the two never drift.
 *
 * Defined as `const` objects + string-literal unions (not TS `enum`) so they are
 * tree-shakeable and safe to ship to the browser.
 */

export const Role = {
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  AGENT: "AGENT",
  VIEWER: "VIEWER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const MemberStatus = {
  INVITED: "INVITED",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;
export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus];

export const OrderStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  RETURNED: "RETURNED",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const FollowupStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  SNOOZED: "SNOOZED",
} as const;
export type FollowupStatus = (typeof FollowupStatus)[keyof typeof FollowupStatus];

export const NotableType = {
  CUSTOMER: "CUSTOMER",
  ORDER: "ORDER",
  INTERNAL: "INTERNAL",
} as const;
export type NotableType = (typeof NotableType)[keyof typeof NotableType];

export const NotificationType = {
  FOLLOWUP_DUE: "FOLLOWUP_DUE",
  ORDER_STATUS: "ORDER_STATUS",
  TEAM_INVITE: "TEAM_INVITE",
  SYSTEM: "SYSTEM",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const SubscriptionStatus = {
  TRIALING: "TRIALING",
  ACTIVE: "ACTIVE",
  PAST_DUE: "PAST_DUE",
  CANCELLED: "CANCELLED",
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const SubscriptionPlan = {
  FREE: "FREE",
  PRO: "PRO",
  BUSINESS: "BUSINESS",
} as const;
export type SubscriptionPlan = (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];

export const AuditAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  IMPORT: "IMPORT",
  EXPORT: "EXPORT",
  LOGIN: "LOGIN",
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
