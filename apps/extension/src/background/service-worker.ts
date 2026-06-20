/**
 * Background service worker — the ONLY place the auth token lives. Content scripts
 * and popup never see it; they post messages and the worker attaches the bearer
 * token + active-org header before calling the backend. This keeps the token off
 * the messenger.com page (XSS containment).
 */
import { ORG_HEADER } from "@messenger/shared";
import type { ApiResponse, AuthStatus, ExtMessage } from "../lib/messaging";
import { storage } from "../lib/storage";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function apiFetch(
  method: string,
  path: string,
  body?: unknown,
): Promise<ApiResponse> {
  const token = await storage.getToken();
  const orgId = await storage.getOrg();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (orgId) headers[ORG_HEADER] = orgId;

  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = res.status === 204 ? undefined : await res.json().catch(() => undefined);
    return { ok: res.ok, status: res.status, data, error: res.ok ? undefined : data?.message };
  } catch (e) {
    return { ok: false, status: 0, error: (e as Error).message };
  }
}

async function login(email: string, password: string): Promise<ApiResponse> {
  try {
    const res = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    // Better Auth bearer plugin returns the token in the set-auth-token header.
    const token = res.headers.get("set-auth-token") ?? data?.token;
    if (res.ok && token) {
      await storage.setToken(token);
      // Pick the user's first org as active by default.
      const orgs = await apiFetch("GET", "/organizations");
      const first = (orgs.data as Array<{ id: string }> | undefined)?.[0];
      if (first) await storage.setOrg(first.id);
    }
    return { ok: res.ok, status: res.status, data, error: res.ok ? undefined : data?.message };
  } catch (e) {
    return { ok: false, status: 0, error: (e as Error).message };
  }
}

async function authStatus(): Promise<AuthStatus> {
  const token = await storage.getToken();
  if (!token) return { authenticated: false, orgId: null, orgs: [] };
  const orgsRes = await apiFetch("GET", "/organizations");
  if (!orgsRes.ok) return { authenticated: false, orgId: null, orgs: [] };
  return {
    authenticated: true,
    orgId: await storage.getOrg(),
    orgs: (orgsRes.data as AuthStatus["orgs"]) ?? [],
  };
}

chrome.runtime.onMessage.addListener((message: ExtMessage, _sender, sendResponse) => {
  (async () => {
    switch (message.kind) {
      case "API":
        sendResponse(await apiFetch(message.method, message.path, message.body));
        break;
      case "LOGIN":
        sendResponse(await login(message.email, message.password));
        break;
      case "LOGOUT":
        await storage.setToken(null);
        sendResponse({ ok: true, status: 200 });
        break;
      case "AUTH_STATUS":
        sendResponse(await authStatus());
        break;
      case "SET_ORG":
        await storage.setOrg(message.orgId);
        sendResponse({ ok: true, status: 200 });
        break;
      default:
        sendResponse({ ok: false, status: 400, error: "Unknown message" });
    }
  })();
  return true; // keep the message channel open for the async response
});
