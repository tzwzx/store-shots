// Your look: turn one slide into a full HTML document for a single screenshot.
// The same /slide/:id output drives both preview and build, so what you see is
// exactly what gets captured. This is the only render point.

import type { RenderContext } from "store-shots";

import { canvas } from "./config";
import type { Slide } from "./config";

export const renderSlideHtml = (slide: Slide, ctx: RenderContext): string => {
  // Resolve an image under content/assets/. `exists` lets you show a placeholder
  // before the real screenshot is in place.
  const screen = ctx.asset(`${slide.id}.png`);
  const body = screen.exists
    ? `<img src="${screen.url}" alt="" style="width:100%;height:100%;object-fit:cover" />`
    : `<div style="display:grid;place-items:center;height:100%;color:#9bb">no asset yet</div>`;

  return `<!doctype html>
<html>
<head><meta charset="utf-8" /><style>
  * { margin: 0; box-sizing: border-box; }
  .canvas { width: ${canvas.width}px; height: ${canvas.height}px; overflow: hidden;
    background: linear-gradient(160deg, #0b1f3a, #061325); color: #fff;
    font-family: -apple-system, sans-serif; }
  h1 { padding: 150px 90px 0; font-size: 96px; line-height: 1.25; text-align: center; }
  .device { width: 900px; height: 1850px; margin: 90px auto 0; border-radius: 90px;
    overflow: hidden; background: #000; }
</style></head>
<body><div class="canvas"><h1>${slide.pr}</h1><div class="device">${body}</div></div></body>
</html>`;
};
