/**
 * Best-effort extraction of the active conversation's Facebook name + profile URL
 * from the Messenger DOM. Messenger's markup changes often, so selectors are
 * defensive with fallbacks and the sidebar always allows manual override.
 */
export interface DetectedContact {
  fbName: string | null;
  fbProfileUrl: string | null;
}

export function detectContact(doc: Document = document): DetectedContact {
  return {
    fbName: detectName(doc),
    fbProfileUrl: detectProfileUrl(doc),
  };
}

function detectName(doc: Document): string | null {
  // The conversation header usually holds the contact's name in an <h1>/<h2>.
  const headerSelectors = [
    '[role="main"] h1 span',
    '[role="main"] h2 span',
    'div[aria-label][role="main"] h1',
  ];
  for (const sel of headerSelectors) {
    const el = doc.querySelector(sel);
    const text = el?.textContent?.trim();
    if (text && text.length > 0 && text.length < 80) return text;
  }
  // Fallback: the document title often contains the contact name.
  const title = doc.title.replace(/\s*\|\s*Messenger.*$/i, "").trim();
  return title && !/messenger/i.test(title) ? title : null;
}

function detectProfileUrl(doc: Document): string | null {
  // Look for a link to a facebook.com profile within the active conversation.
  const links = Array.from(
    doc.querySelectorAll<HTMLAnchorElement>('a[href*="facebook.com/"]'),
  );
  for (const a of links) {
    const href = a.href;
    if (/facebook\.com\/(profile\.php\?id=\d+|[A-Za-z0-9.]+)(\/|$|\?)/.test(href)) {
      return href.split("?")[0]?.includes("profile.php") ? href : href.split("?")[0] ?? null;
    }
  }
  return null;
}
