import { expect, test } from "bun:test";

import type { RenderContext } from "store-shots";

import { canvas, slides } from "./scaffold/content/config";
import { renderSlideHtml } from "./scaffold/content/template";

const missing: RenderContext = { asset: (relPath) => ({ exists: false, url: `/assets/${relPath}` }) };
const present: RenderContext = { asset: (relPath) => ({ exists: true, url: `/assets/${relPath}` }) };

test("scaffold canvas is the App Store 6.9-inch size (1242x2688)", () => {
  expect(canvas).toEqual({ height: 2688, width: 1242 });
});

test("scaffold ships at least two example slides with unique ids", () => {
  expect(slides.length).toBeGreaterThanOrEqual(2);
  const ids = slides.map((slide) => slide.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test("scaffold renderSlideHtml returns a full document sized to the canvas", () => {
  const html = renderSlideHtml(slides[0]!, missing);
  expect(html.startsWith("<!doctype html>")).toBe(true);
  expect(html).toContain(`${canvas.width}px`);
  expect(html).toContain(`${canvas.height}px`);
});

test("scaffold shows a placeholder when the asset is missing", () => {
  expect(renderSlideHtml(slides[0]!, missing)).toContain("no asset yet");
});

test("scaffold renders an object-fit cover image when the asset exists", () => {
  const html = renderSlideHtml(slides[0]!, present);
  expect(html).toContain("object-fit:cover");
  expect(html).not.toContain("no asset yet");
});
