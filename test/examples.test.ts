import { expect, test } from "bun:test";

import { makeTestContext } from "store-shots/testing";

import { content } from "../examples/showcase/content";

test("showcase slides render full documents sized to the canvas", () => {
  for (const slide of content.slides) {
    const html = content.renderSlideHtml(slide, makeTestContext());
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain(`${content.canvas.width}px`);
    expect(html).toContain(`${content.canvas.height}px`);
  }
});

test("showcase ships at least four slides with unique ids", () => {
  expect(content.slides.length).toBeGreaterThanOrEqual(4);
  const ids = content.slides.map((slide) => slide.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test("showcase wires a specPanel for the preview gallery", () => {
  const [first] = content.slides;
  if (!first) {
    throw new Error("showcase must ship at least one slide");
  }
  const rows = content.specPanel?.(first) ?? [];
  expect(rows.length).toBeGreaterThan(0);
});

test("showcase needs no assets: the mock UI is plain HTML/CSS", () => {
  // The whole point of the example is that no app or simulator is involved,
  // so rendering with a context where every asset is missing must still
  // produce the final artwork (no placeholder branch in sight).
  for (const slide of content.slides) {
    const html = content.renderSlideHtml(slide, makeTestContext());
    expect(html).not.toContain("missing");
  }
});
