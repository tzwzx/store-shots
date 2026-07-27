// Data for the fictional "Tidy" to-do app used in the README sample images.
// Nothing here comes from a real app: the screens inside the device frame are
// drawn with plain HTML/CSS in template.ts.

import { CANVAS } from "store-shots";
import type { SlideBase, SpecRow } from "store-shots";

/** Which mock screen the device frame shows. `icon` is the closing slide. */
export type Screen = "today" | "add" | "dark" | "icon";

export interface Slide extends SlideBase {
  badge?: string;
  bg: [string, string];
  pr: { accent: string; lines: string[] };
  screen: Screen;
  sub: string;
  tone: "dark" | "light";
}

const SCREEN_STYLE: Record<
  Screen,
  { bg: [string, string]; tone: "dark" | "light" }
> = {
  add: { bg: ["#E7F6EF", "#C2E7D6"], tone: "light" },
  dark: { bg: ["#101D3E", "#070D20"], tone: "dark" },
  icon: { bg: ["#12224A", "#0A1430"], tone: "dark" },
  today: { bg: ["#EAF2FF", "#C9DCF8"], tone: "light" },
};

type Seed = Omit<Slide, "bg" | "tone">;
const styled = (seed: Seed): Slide => ({
  ...seed,
  ...SCREEN_STYLE[seed.screen],
});

export const slides: Slide[] = (
  [
    {
      badge: "Free",
      id: "1",
      pr: { accent: "one place.", lines: ["Everything in", "one place."] },
      screen: "today",
      sub: "Every task. Every day. One list.",
    },
    {
      id: "2",
      pr: { accent: "Captured.", lines: ["Thought it?", "Captured."] },
      screen: "add",
      sub: "Add a task in one tap.",
    },
    {
      id: "3",
      pr: { accent: "after dark.", lines: ["Beautiful", "after dark."] },
      screen: "dark",
      sub: "Dark mode that follows the sun.",
    },
    {
      id: "4",
      pr: { accent: "More done.", lines: ["Less app.", "More done."] },
      screen: "icon",
      sub: "Free forever. No account needed.",
    },
  ] satisfies Seed[]
).map(styled);

export const canvas = CANVAS.iphone69;

export const specPanel = (slide: Slide): SpecRow[] => {
  const rows: SpecRow[] = [
    { label: "PR", value: slide.pr.lines.join(" / ") },
    { label: "sub", value: slide.sub },
    { label: "tone", value: slide.tone },
  ];
  if (slide.badge) {
    rows.push({ label: "badge", value: slide.badge });
  }
  return rows;
};
