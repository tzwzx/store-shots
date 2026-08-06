// Your data: the slide list and the output canvas size.
// This file is the single source of truth for what each screenshot says.
// Edit freely — extend Slide with any fields your template needs.

import { CANVAS } from "@tzwzx/store-shots";
import type { SlideBase, SpecRow } from "@tzwzx/store-shots";

// A slide describes one screenshot. SlideBase only requires a string `id`.
// Add a `layout` field here when slides call for different compositions —
// the template can branch on it (see the header comment in template.ts).
export interface Slide extends SlideBase {
  pr: string;
}

// Rows shown under each thumbnail in the preview gallery. Handy for
// cross-checking the rendered text against the intended copy.
export const specPanel = (slide: Slide): SpecRow[] => [
  { label: "PR", value: slide.pr },
];

// App Store 6.9" portrait canvas (1320x2868). Every PNG is exactly width x height.
// Other presets: CANVAS.iphone69Alt / iphone65 / ipad13 — or any custom size.
export const canvas = CANVAS.iphone69;

// Two example slides so `store:build` produces output right away.
export const slides: Slide[] = [
  { id: "1", pr: "Everything in one screen." },
  { id: "2", pr: "Add a note in one tap." },
];
