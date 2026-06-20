"use client";

import { useRouter } from "next/navigation";
import { Button } from "@messenger/ui";
import { signOut } from "@/lib/auth-client";
import { setActiveOrgId } from "@/lib/api-client";
import { useOrganizations, useActiveOrg } from "@/hooks/use-organizations";

export function Topbar() {
  const router = useRouter();
  const { data: orgs } = useOrganizations();
  const active = useActiveOrg(orgs);

  function onSwitch(e: React.ChangeEvent<HTMLSelectElement>) {
    setActiveOrgId(e.target.value);
    router.refresh();
    window.location.reload();
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-2">
        {orgs && orgs.length > 0 && (
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={active?.id ?? ""}
            onChange={onSwitch}
          >
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.role.toLowerCase()})
              </option>
            ))}
          </select>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          await signOut();
          router.push("/login");
        }}
      >
        Sign out
      </Button>
    </header>
  );
}
