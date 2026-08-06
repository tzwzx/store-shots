// Data for the "directions" sampler: the same fictional "Tidy" to-do app as
// examples/showcase, rendered in three deliberately contrasting art directions.
// The engine never dictates a layout — this example exists to prove the default
// look is one option among many.

import { CANVAS } from "@tzwzx/store-shots";
import type { SlideBase, SpecRow } from "@tzwzx/store-shots";

/** One slide per direction; the template returns a completely different body for each. */
export type Direction = "collage" | "editorial" | "full-bleed";

export interface Slide extends SlideBase {
  direction: Direction;
  pr: { accent: string; lines: string[] };
  sub: string;
}

export const slides: Slide[] = [
  {
    direction: "full-bleed",
    id: "1",
    pr: { accent: "one place.", lines: ["Everything in", "one place."] },
    sub: "Every task. Every day. One list.",
  },
  {
    direction: "editorial",
    id: "2",
    pr: { accent: "Captured.", lines: ["Thought it?", "Captured."] },
    sub: "Add a task in one tap.",
  },
  {
    direction: "collage",
    id: "3",
    pr: { accent: "More done.", lines: ["Less app.", "More done."] },
    sub: "Lists, reminders, and notes in one app.",
  },
];

export const canvas = CANVAS.iphone69;

export const specPanel = (slide: Slide): SpecRow[] => [
  { label: "direction", value: slide.direction },
  { label: "PR", value: slide.pr.lines.join(" / ") },
  { label: "sub", value: slide.sub },
];
