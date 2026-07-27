// Slide-list helpers: multi-language expansion and the unique-id invariant.

import type { SlideBase } from "./types";

/**
 * Expand language-agnostic seeds into per-language slides (language-major
 * order: all slides of the first language, then the next). The builder decides
 * the id convention, e.g. `${lang}-${seed.key}`.
 */
export const expandSlides = <
  TLang extends string,
  TSeed,
  TSlide extends SlideBase,
>(
  langs: readonly TLang[],
  seeds: readonly TSeed[],
  build: (lang: TLang, seed: TSeed) => TSlide
): TSlide[] => langs.flatMap((lang) => seeds.map((seed) => build(lang, seed)));

/** Throws when two slides share an id. Ids become routes and file names, so they must be unique. */
export const assertUniqueIds = (slides: readonly SlideBase[]): void => {
  const seen = new Set<string>();
  const duplicated = new Set<string>();
  for (const slide of slides) {
    if (seen.has(slide.id)) {
      duplicated.add(slide.id);
    }
    seen.add(slide.id);
  }
  if (duplicated.size > 0) {
    throw new Error(
      `Duplicate slide id(s): ${[...duplicated].join(", ")}. ` +
        "Each id becomes /slide/<id> and <id>.png, so ids must be unique."
    );
  }
};
