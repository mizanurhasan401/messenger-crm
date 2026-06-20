/** Typed message contract between content script / popup and the service worker. */
export type ExtMessage =
  | { kind: "API"; method: "GET" | "POST" | "PATCH" | "DELETE"; path: string; body?: unknown }
  | { kind: "LOGIN"; email: string; password: string }
  | { kind: "LOGOUT" }
  | { kind: "AUTH_STATUS" }
  | { kind: "SET_ORG"; orgId: string };

export interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export interface AuthStatus {
  authenticated: boolean;
  orgId: string | null;
  orgs: Array<{ id: string; name: string; role: string }>;
}

/** Promise wrapper around chrome.runtime.sendMessage. */
export function sendMessage<T = unknown>(message: ExtMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const err = chrome.runtime.lastError;
      if (err) reject(new Error(err.message));
      else resolve(response as T);
    });
  });
}
