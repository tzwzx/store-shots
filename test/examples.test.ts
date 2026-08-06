import { expect, test } from "bun:test";

import { makeTestContext } from "@tzwzx/store-shots/testing";

import { content as directionsContent } from "../examples/directions/content";
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

test("directions slides render full documents sized to the canvas", () => {
  for (const slide of directionsContent.slides) {
    const html = directionsContent.renderSlideHtml(slide, makeTestContext());
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain(`${directionsContent.canvas.width}px`);
    expect(html).toContain(`${directionsContent.canvas.height}px`);
  }
});

test("directions ships exactly one slide per art direction", () => {
  const dirs = directionsContent.slides.map((slide) => slide.direction);
  expect(dirs.toSorted()).toEqual(["collage", "editorial", "full-bleed"]);
  const ids = directionsContent.slides.map((slide) => slide.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test("directions renders three genuinely different layouts", () => {
  // The sampler exists to prove the engine dictates no layout: every slide
  // must carry its direction marker and produce a distinct document.
  const htmls = directionsContent.slides.map((slide) =>
    directionsContent.renderSlideHtml(slide, makeTestContext())
  );
  for (const [i, slide] of directionsContent.slides.entries()) {
    expect(htmls[i]).toContain(`dir-${slide.direction}`);
  }
  expect(new Set(htmls).size).toBe(htmls.length);
});

test("directions needs no assets: everything is plain HTML/CSS", () => {
  for (const slide of directionsContent.slides) {
    const html = directionsContent.renderSlideHtml(slide, makeTestContext());
    expect(html).not.toContain("missing");
  }
});
