import { expect, test } from "bun:test";

import { expandSlides } from "../src/index";

interface Seed {
  key: string;
}

test("expandSlides builds one slide per language x seed, language-major order", () => {
  const seeds: Seed[] = [{ key: "a" }, { key: "b" }];
  const slides = expandSlides(["jp", "en"], seeds, (lang, seed) => ({
    id: `${lang}-${seed.key}`,
    lang,
  }));
  expect(slides.map((slide) => slide.id)).toEqual([
    "jp-a",
    "jp-b",
    "en-a",
    "en-b",
  ]);
  expect(slides[0]?.lang).toBe("jp");
});

test("expandSlides returns an empty list when there are no seeds", () => {
  expect(expandSlides(["jp"], [], () => ({ id: "x" }))).toEqual([]);
});
