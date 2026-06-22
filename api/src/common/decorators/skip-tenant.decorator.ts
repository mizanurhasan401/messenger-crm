import { SetMetadata } from '@nestjs/common';
import { SKIP_TENANT_KEY } from '../constants';

/** Opt a route out of TenantGuard (e.g. cross-tenant admin or auth routes). */
export const SkipTenant = () => SetMetadata(SKIP_TENANT_KEY, true);
