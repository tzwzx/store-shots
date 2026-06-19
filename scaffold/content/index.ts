// Glue: bundle data + look + assets into the single `content` object the engine
// consumes. You rarely need to edit this file.

import path from "node:path";

import type { StoreShotsContent } from "store-shots";

import { canvas, slides } from "./config";
import type { Slide } from "./config";
import { renderSlideHtml } from "./template";

export const content: StoreShotsContent<Slide> = {
  assetsDir: path.join(import.meta.dir, "assets"),
  canvas,
  renderSlideHtml,
  slides,
};
