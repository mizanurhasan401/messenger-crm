/**
 * Content script entrypoint: mounts the CRM sidebar into the Messenger page and
 * starts the quick-reply shortcut listener.
 */
import { createRoot } from "react-dom/client";
import { SidebarApp } from "../sidebar/App";
import { initShortcutListener } from "./shortcut-listener";

const SIDEBAR_ID = "messenger-crm-sidebar";

function mountSidebar(): void {
  if (document.getElementById(SIDEBAR_ID)) return;

  const host = document.createElement("div");
  host.id = SIDEBAR_ID;
  Object.assign(host.style, {
    position: "fixed",
    top: "0",
    right: "0",
    width: "320px",
    height: "100vh",
    background: "#fff",
    borderLeft: "1px solid #e5e7eb",
    zIndex: "2147483647",
    overflowY: "auto",
    boxShadow: "-2px 0 8px rgba(0,0,0,0.08)",
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(host);

  createRoot(host).render(<SidebarApp />);
}

mountSidebar();
void initShortcutListener();
