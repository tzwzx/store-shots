// Your data: the slide list and the output canvas size.
// This file is the single source of truth for what each screenshot says.
// Edit freely — extend Slide with any fields your template needs.

import type { SlideBase } from "store-shots";

// A slide describes one screenshot. SlideBase only requires a string `id`.
export interface Slide extends SlideBase {
  pr: string;
}

// App Store 6.9" portrait canvas. Every PNG is exactly width x height.
export const canvas = { height: 2688, width: 1242 };

// Two example slides so `store:build` produces output right away.
export const slides: Slide[] = [
  { id: "1", pr: "Everything in one screen." },
  { id: "2", pr: "Add a note in one tap." },
];
