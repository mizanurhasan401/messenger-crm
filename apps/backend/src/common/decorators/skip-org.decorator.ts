import { SetMetadata } from "@nestjs/common";

export const SKIP_ORG_KEY = "skipOrg";

/**
 * Authenticated route that does NOT require an active organization membership
 * (e.g. listing the user's orgs, or creating their first org). AuthGuard still runs.
 */
export const SkipOrg = () => SetMetadata(SKIP_ORG_KEY, true);
