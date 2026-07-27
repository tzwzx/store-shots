import { expect, test } from "bun:test";

import { captureSlides } from "../src/capture";
import { fixture } from "./fixtures";

test("captureSlides rejects unknown ids instead of silently skipping them", async () => {
  await expect(
    captureSlides(fixture, {
      ids: ["demo-1", "nope"],
      outputDir: "/tmp/store-shots-never-written",
    })
  ).rejects.toThrow(/nope/u);
});

test("captureSlides still rejects when no id matches at all", async () => {
  await expect(
    captureSlides(fixture, {
      ids: ["nope"],
      outputDir: "/tmp/store-shots-never-written",
    })
  ).rejects.toThrow(/nope/u);
});
