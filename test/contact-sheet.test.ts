import { expect, test } from "bun:test";

import { renderContactSheet } from "../src/contact-sheet";

test("renders an img for each id", () => {
  const html = renderContactSheet(["jp-1", "en-7"]);
  expect(html).toContain(`src="jp-1.png"`);
  expect(html).toContain(`src="en-7.png"`);
});

test("escapes quotes in ids so attribute values cannot break", () => {
  const html = renderContactSheet([`a"b`]);
  expect(html).toContain("a&quot;b");
  expect(html).not.toContain(`src="a"b.png"`);
});
