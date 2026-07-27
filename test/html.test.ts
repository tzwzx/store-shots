import { expect, test } from "bun:test";

import { accentHtml, escapeHtml } from "../src/html";

test("escapeHtml escapes ampersands, angle brackets, and both quote styles", () => {
  expect(escapeHtml(`<a href="x" title='y'>Q&A</a>`)).toBe(
    "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;Q&amp;A&lt;/a&gt;"
  );
});

test("accentHtml wraps every occurrence of the accent substring", () => {
  expect(accentHtml("One screen. Everything. One screen.", "One screen.")).toBe(
    `<span class="accent">One screen.</span> Everything. <span class="accent">One screen.</span>`
  );
});

test("accentHtml escapes both the line and the accent", () => {
  expect(accentHtml("a < b", "<")).toBe(`a <span class="accent">&lt;</span> b`);
});

test("accentHtml returns the escaped line when the accent is empty", () => {
  expect(accentHtml("a & b", "")).toBe("a &amp; b");
});

test("accentHtml returns the escaped line when the accent does not occur", () => {
  expect(accentHtml("a & b", "zzz")).toBe("a &amp; b");
});

test("package.json exposes the html and testing subpath exports", async () => {
  const pkg = await Bun.file(
    new URL("../package.json", import.meta.url)
  ).json();
  expect(pkg.exports["./html"]).toBe("./src/html.ts");
  expect(pkg.exports["./testing"]).toBe("./src/testing.ts");
});
