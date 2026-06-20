"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, getActiveOrgId, setActiveOrgId } from "@/lib/api-client";
import type { Role } from "@messenger/shared";

export interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  role: Role;
}

export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: () => apiClient.get<OrgSummary[]>("/organizations"),
  });
}

/** Reads the active org id, defaulting to the first org if none is selected. */
export function useActiveOrg(orgs: OrgSummary[] | undefined): OrgSummary | undefined {
  const active = getActiveOrgId();
  if (!orgs || orgs.length === 0) return undefined;
  const found = orgs.find((o) => o.id === active);
  if (!found && orgs[0]) {
    setActiveOrgId(orgs[0].id);
    return orgs[0];
  }
  return found;
}
