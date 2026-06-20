import { useEffect, useState } from "react";
import { extApi } from "../lib/api-client";
import type { AuthStatus } from "../lib/messaging";

export function Popup() {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    extApi.authStatus().then(setStatus);
  }, []);

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await extApi.login(String(form.get("email")), String(form.get("password")));
    setLoading(false);
    if (!res.ok) setError(res.error ?? "Login failed");
    else setStatus(await extApi.authStatus());
  }

  async function onLogout() {
    await extApi.logout();
    setStatus(await extApi.authStatus());
  }

  async function onOrgChange(e: React.ChangeEvent<HTMLSelectElement>) {
    await extApi.setOrg(e.target.value);
    setStatus(await extApi.authStatus());
  }

  const box: React.CSSProperties = { padding: 12, display: "grid", gap: 8 };

  if (status?.authenticated) {
    return (
      <div style={box}>
        <strong>Messenger CRM</strong>
        <label style={{ fontSize: 12 }}>Active organization</label>
        <select value={status.orgId ?? ""} onChange={onOrgChange}>
          {status.orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <button onClick={onLogout}>Sign out</button>
      </div>
    );
  }

  return (
    <form onSubmit={onLogin} style={box}>
      <strong>Sign in</strong>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      {error && <span style={{ color: "crimson", fontSize: 12 }}>{error}</span>}
      <button type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
