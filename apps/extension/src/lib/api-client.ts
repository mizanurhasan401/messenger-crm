/** Content/popup-side API client — proxies every call through the worker. */
import type { ApiResponse, AuthStatus } from "./messaging";
import { sendMessage } from "./messaging";

export const extApi = {
  get: <T>(path: string) => sendMessage<ApiResponse<T>>({ kind: "API", method: "GET", path }),
  post: <T>(path: string, body?: unknown) =>
    sendMessage<ApiResponse<T>>({ kind: "API", method: "POST", path, body }),
  patch: <T>(path: string, body?: unknown) =>
    sendMessage<ApiResponse<T>>({ kind: "API", method: "PATCH", path, body }),
  delete: <T>(path: string) => sendMessage<ApiResponse<T>>({ kind: "API", method: "DELETE", path }),
  authStatus: () => sendMessage<AuthStatus>({ kind: "AUTH_STATUS" }),
  login: (email: string, password: string) =>
    sendMessage<ApiResponse>({ kind: "LOGIN", email, password }),
  logout: () => sendMessage<ApiResponse>({ kind: "LOGOUT" }),
  setOrg: (orgId: string) => sendMessage<ApiResponse>({ kind: "SET_ORG", orgId }),
};
