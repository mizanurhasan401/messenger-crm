import { useEffect, useState } from "react";
import { detectContact, type DetectedContact } from "../content/fb-detector";
import { extApi } from "../lib/api-client";
import type { AuthStatus } from "../lib/messaging";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  fbProfileUrl: string | null;
  orders?: Array<{ id: string; orderNumber: string; status: string; total: string }>;
}

export function SidebarApp() {
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [detected, setDetected] = useState<DetectedContact>({ fbName: null, fbProfileUrl: null });
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    extApi.authStatus().then(setAuth);
    setDetected(detectContact());
  }, []);

  // Try to match an existing customer by the detected FB profile URL.
  useEffect(() => {
    if (!auth?.authenticated || !detected.fbName) return;
    extApi
      .get<{ data: Customer[] }>(`/customers?search=${encodeURIComponent(detected.fbName)}`)
      .then((res) => {
        const found = res.data?.data?.find(
          (c) => c.fbProfileUrl === detected.fbProfileUrl || c.name === detected.fbName,
        );
        setCustomer(found ?? null);
      });
  }, [auth, detected]);

  async function saveCustomer() {
    setSaving(true);
    const res = await extApi.post<Customer>("/customers", {
      name: detected.fbName ?? "Unknown",
      fbName: detected.fbName,
      fbProfileUrl: detected.fbProfileUrl,
      phone: phone || undefined,
      source: "messenger",
    });
    setSaving(false);
    if (res.ok && res.data) setCustomer(res.data);
  }

  if (!auth) return <div className="p-3 text-sm">Loading…</div>;
  if (!auth.authenticated) {
    return (
      <div className="p-3 text-sm">
        <p className="mb-2 font-medium">Messenger CRM</p>
        <p className="text-gray-500">Open the extension popup to sign in.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 text-sm">
      <div className="font-semibold">Customer</div>
      <div className="rounded border p-2">
        <div className="font-medium">{detected.fbName ?? "Unknown contact"}</div>
        {detected.fbProfileUrl && (
          <a className="break-all text-xs text-blue-600" href={detected.fbProfileUrl}>
            {detected.fbProfileUrl}
          </a>
        )}
      </div>

      {customer ? (
        <>
          <div className="rounded border p-2">
            <div>📞 {customer.phone ?? "No phone saved"}</div>
          </div>
          <div className="font-semibold">Recent orders</div>
          <div className="space-y-1">
            {customer.orders?.length ? (
              customer.orders.map((o) => (
                <div key={o.id} className="flex justify-between rounded border p-1 text-xs">
                  <span>{o.orderNumber}</span>
                  <span>{o.status}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500">No orders yet.</div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <input
            className="w-full rounded border px-2 py-1"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button
            className="w-full rounded bg-blue-600 px-2 py-1 text-white disabled:opacity-50"
            onClick={saveCustomer}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save customer"}
          </button>
        </div>
      )}
    </div>
  );
}
