/** Thin async wrapper over chrome.storage.local. Token lives ONLY here (worker). */
const KEYS = {
  TOKEN: "auth_token",
  ORG: "active_org",
} as const;

export const storage = {
  async getToken(): Promise<string | null> {
    const r = await chrome.storage.local.get(KEYS.TOKEN);
    return (r[KEYS.TOKEN] as string) ?? null;
  },
  async setToken(token: string | null): Promise<void> {
    if (token) await chrome.storage.local.set({ [KEYS.TOKEN]: token });
    else await chrome.storage.local.remove(KEYS.TOKEN);
  },
  async getOrg(): Promise<string | null> {
    const r = await chrome.storage.local.get(KEYS.ORG);
    return (r[KEYS.ORG] as string) ?? null;
  },
  async setOrg(orgId: string): Promise<void> {
    await chrome.storage.local.set({ [KEYS.ORG]: orgId });
  },
};
