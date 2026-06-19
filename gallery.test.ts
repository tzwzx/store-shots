import { expect, test } from "bun:test";

import { fixture } from "./fixtures";
import { renderGallery } from "./gallery";

test("embeds an iframe per slide via /slide/:id", () => {
  const html = renderGallery(fixture);
  for (const slide of fixture.slides) {
    expect(html).toContain(`src="/slide/${slide.id}"`);
  }
});

test("shows the slide count", () => {
  const html = renderGallery(fixture);
  expect(html).toContain(`${fixture.slides.length} slides`);
});
