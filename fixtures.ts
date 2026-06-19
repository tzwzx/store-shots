// Minimal content for the engine's own tests. Kept independent of any consumer's content.

import path from "node:path";

import type { RenderContext, SlideBase, StoreShotsContent } from "./types";

interface DemoSlide extends SlideBase {
  title: string;
}

const renderSlideHtml = (slide: DemoSlide, ctx: RenderContext): string => {
  const screen = ctx.asset(`${slide.id}.png`);
  const body = screen.exists
    ? `<img src="${screen.url}" alt="" />`
    : `<div class="ph">missing</div>`;
  return `<!doctype html><html><body><div class="canvas">${slide.title}${body}</div></body></html>`;
};

export const fixture: StoreShotsContent<DemoSlide> = {
  assetsDir: path.join(import.meta.dir, "__fixture_assets__"),
  canvas: { height: 2688, width: 1242 },
  renderSlideHtml,
  slides: [
    { id: "demo-1", title: "Demo One" },
    { id: "demo-2", title: "Demo Two" },
  ],
  specPanel: (slide) => [{ label: "title", value: slide.title }],
};
