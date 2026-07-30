import { expect, test } from "bun:test";

import { makeTestContext } from "@tzwzx/store-shots/testing";

import { content } from "../scaffold/content";
import { canvas, slides } from "../scaffold/content/config";
import { renderSlideHtml } from "../scaffold/content/template";

const [firstSlide] = slides;
if (!firstSlide) {
  throw new Error("scaffold must ship at least one slide");
}

const missing = makeTestContext();
const present = makeTestContext({ exists: true });

test("scaffold RUNBOOK.md documents the reference Maestro capture workflow", async () => {
  const runbook = await Bun.file(
    new URL("../scaffold/RUNBOOK.md", import.meta.url)
  ).text();
  expect(runbook).toContain("maestro");
  expect(runbook).toContain("content/assets");
  expect(runbook).toContain("xcrun simctl");
});

test("scaffold RUNBOOK.md ships a fill-in design brief", async () => {
  const runbook = await Bun.file(
    new URL("../scaffold/RUNBOOK.md", import.meta.url)
  ).text();
  expect(runbook).toContain("## Design brief");
  expect(runbook).toContain("Story arc");
  expect(runbook).toContain("OCR keywords");
});

test("scaffold canvas is the App Store 6.9-inch size (1320x2868)", () => {
  expect(canvas).toEqual({ height: 2868, width: 1320 });
});

test("scaffold ships at least two example slides with unique ids", () => {
  expect(slides.length).toBeGreaterThanOrEqual(2);
  const ids = slides.map((slide) => slide.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test("scaffold wires specPanel so the gallery shows copy rows out of the box", () => {
  const rows = content.specPanel?.(firstSlide);
  expect(rows).toEqual([{ label: "PR", value: firstSlide.pr }]);
});

test("scaffold renderSlideHtml returns a full document sized to the canvas", () => {
  const html = renderSlideHtml(firstSlide, missing);
  expect(html.startsWith("<!doctype html>")).toBe(true);
  expect(html).toContain(`${canvas.width}px`);
  expect(html).toContain(`${canvas.height}px`);
});

test("scaffold template escapes the PR copy", () => {
  const html = renderSlideHtml({ id: "x", pr: "1 < 2 & done" }, missing);
  expect(html).toContain("1 &lt; 2 &amp; done");
});

test("scaffold shows a placeholder when the asset is missing", () => {
  expect(renderSlideHtml(firstSlide, missing)).toContain("no asset yet");
});

test("scaffold renders an object-fit cover image when the asset exists", () => {
  const html = renderSlideHtml(firstSlide, present);
  expect(html).toContain("object-fit:cover");
  expect(html).not.toContain("no asset yet");
});
