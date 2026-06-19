import { expect, test } from "bun:test";

import { renderContactSheet } from "./contact-sheet";

test("renders an img for each id", () => {
  const html = renderContactSheet(["jp-1", "en-7"]);
  expect(html).toContain(`src="jp-1.png"`);
  expect(html).toContain(`src="en-7.png"`);
});
