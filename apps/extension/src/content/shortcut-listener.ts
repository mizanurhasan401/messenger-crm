/**
 * Watches the Messenger composer for a `/shortcut` token and replaces it with the
 * matching quick-reply content fetched from the CRM. Selectors are best-effort.
 */
import { extApi } from "../lib/api-client";

interface QuickReply {
  shortcut: string;
  content: string;
}

let cache: QuickReply[] = [];

export async function initShortcutListener(): Promise<void> {
  const res = await extApi.get<QuickReply[]>("/quick-replies");
  if (res.ok && res.data) cache = res.data;

  document.addEventListener("keyup", (e) => {
    const target = e.target as HTMLElement | null;
    if (!target || !isComposer(target)) return;
    const text = target.textContent ?? "";
    const match = text.match(/(\/[a-z0-9-]+)\s$/i);
    if (!match) return;
    const reply = cache.find((q) => q.shortcut === match[1]?.trim());
    if (reply) {
      // Replace the shortcut token with the quick-reply content.
      target.textContent = text.replace(/(\/[a-z0-9-]+)\s$/i, reply.content + " ");
      placeCaretAtEnd(target);
    }
  });
}

function isComposer(el: HTMLElement): boolean {
  return (
    el.getAttribute("contenteditable") === "true" ||
    el.getAttribute("role") === "textbox" ||
    el.tagName === "TEXTAREA"
  );
}

function placeCaretAtEnd(el: HTMLElement): void {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}
