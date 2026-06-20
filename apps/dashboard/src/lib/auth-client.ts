import { createAuthClient } from "better-auth/react";

/** Better Auth React client — talks to the backend's /api/auth/* endpoints. */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  fetchOptions: { credentials: "include" },
});

export const { signIn, signUp, signOut, useSession } = authClient;
