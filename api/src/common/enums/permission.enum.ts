import { AppRole } from './role.enum';

/** Granular permissions checked by PermissionsGuard. */
export enum Permission {
  // Customer
  CUSTOMER_CREATE = 'customer.create',
  CUSTOMER_READ = 'customer.read',
  CUSTOMER_UPDATE = 'customer.update',
  CUSTOMER_DELETE = 'customer.delete',

  // Order
  ORDER_CREATE = 'order.create',
  ORDER_READ = 'order.read',
  ORDER_UPDATE = 'order.update',
  ORDER_DELETE = 'order.delete',

  // Tag
  TAG_MANAGE = 'tag.manage',

  // Note
  NOTE_MANAGE = 'note.manage',

  // Organization / Users
  ORG_MANAGE = 'org.manage',
  USER_MANAGE = 'user.manage',

  // Billing
  BILLING_MANAGE = 'billing.manage',

  // Analytics / Dashboard
  ANALYTICS_READ = 'analytics.read',

  // Audit
  AUDIT_READ = 'audit.read',
}

/**
 * Role → permission matrix. The single source of truth for RBAC.
 * OWNER gets everything; lower roles get progressively narrower scopes.
 */
export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  [AppRole.OWNER]: Object.values(Permission),

  [AppRole.ADMIN]: [
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_UPDATE,
    Permission.CUSTOMER_DELETE,
    Permission.ORDER_CREATE,
    Permission.ORDER_READ,
    Permission.ORDER_UPDATE,
    Permission.ORDER_DELETE,
    Permission.TAG_MANAGE,
    Permission.NOTE_MANAGE,
    Permission.USER_MANAGE,
    Permission.ANALYTICS_READ,
    Permission.AUDIT_READ,
  ],

  [AppRole.MANAGER]: [
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_UPDATE,
    Permission.ORDER_CREATE,
    Permission.ORDER_READ,
    Permission.ORDER_UPDATE,
    Permission.TAG_MANAGE,
    Permission.NOTE_MANAGE,
    Permission.ANALYTICS_READ,
  ],

  [AppRole.AGENT]: [
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_UPDATE,
    Permission.ORDER_CREATE,
    Permission.ORDER_READ,
    Permission.NOTE_MANAGE,
  ],
};

export function permissionsForRole(role: AppRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
