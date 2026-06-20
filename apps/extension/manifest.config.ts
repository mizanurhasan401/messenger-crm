import { defineManifest } from "@crxjs/vite-plugin";

/** MV3 manifest. Injects a content script + sidebar into Facebook Messenger. */
export default defineManifest({
  manifest_version: 3,
  name: "Messenger CRM",
  version: "0.1.0",
  description: "Facebook Seller CRM inside Messenger",
  action: { default_popup: "src/popup/index.html", default_title: "Messenger CRM" },
  options_page: "src/options/index.html",
  background: { service_worker: "src/background/service-worker.ts", type: "module" },
  permissions: ["storage", "alarms", "activeTab"],
  host_permissions: [
    "https://www.messenger.com/*",
    "https://www.facebook.com/*",
    "http://localhost:4000/*",
  ],
  content_scripts: [
    {
      matches: ["https://www.messenger.com/*", "https://www.facebook.com/messages/*"],
      js: ["src/content/index.tsx"],
      run_at: "document_idle",
    },
  ],
});
