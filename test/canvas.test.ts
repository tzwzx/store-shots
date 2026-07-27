import { expect, test } from "bun:test";

import { CANVAS } from "../src/index";
import type { Canvas } from "../src/index";

test("CANVAS presets cover the App Store portrait sizes", () => {
  expect(CANVAS.iphone69).toEqual({ height: 2868, width: 1320 });
  expect(CANVAS.iphone69Alt).toEqual({ height: 2796, width: 1290 });
  expect(CANVAS.iphone65).toEqual({ height: 2688, width: 1242 });
  expect(CANVAS.ipad13).toEqual({ height: 2752, width: 2064 });
});

test("CANVAS presets satisfy the Canvas type used by StoreShotsContent", () => {
  const canvas: Canvas = CANVAS.iphone69;
  expect(canvas.width).toBeGreaterThan(0);
});
