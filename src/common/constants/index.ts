export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const SKIP_TENANT_KEY = 'skipTenant';

/** CLS (AsyncLocalStorage) keys for the per-request tenant context. */
export const CLS_KEYS = {
  USER_ID: 'userId',
  ORG_ID: 'organizationId',
  ROLE: 'role',
  REQUEST_ID: 'requestId',
} as const;

export const QUEUES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  AUDIT: 'audit',
} as const;

export const CACHE_KEYS = {
  dashboardStats: (orgId: string) => `dashboard:stats:${orgId}`,
  analyticsSales: (orgId: string) => `analytics:sales:${orgId}`,
} as const;
