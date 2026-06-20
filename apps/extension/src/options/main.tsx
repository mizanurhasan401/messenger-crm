import { createRoot } from "react-dom/client";

function Options() {
  return (
    <div>
      <h1>Messenger CRM</h1>
      <p>
        Sign in from the toolbar popup. The sidebar appears automatically on
        messenger.com conversations. Configure the API URL at build time via{" "}
        <code>VITE_API_URL</code>.
      </p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Options />);
