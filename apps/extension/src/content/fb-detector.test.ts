import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { detectContact } from "./fb-detector";

function docFrom(html: string, title = "Rahim Uddin | Messenger"): Document {
  const dom = new JSDOM(html);
  Object.defineProperty(dom.window.document, "title", { value: title, configurable: true });
  return dom.window.document;
}

describe("fb-detector", () => {
  it("reads the contact name from the conversation header", () => {
    const doc = docFrom('<div role="main"><h1><span>Karim Mia</span></h1></div>');
    expect(detectContact(doc).fbName).toBe("Karim Mia");
  });

  it("falls back to the document title", () => {
    const doc = docFrom("<div></div>", "Nadia Akter | Messenger");
    expect(detectContact(doc).fbName).toBe("Nadia Akter");
  });

  it("extracts a facebook profile url", () => {
    const doc = docFrom('<a href="https://facebook.com/karim.mia?ref=x">profile</a>');
    expect(detectContact(doc).fbProfileUrl).toBe("https://facebook.com/karim.mia");
  });
});
