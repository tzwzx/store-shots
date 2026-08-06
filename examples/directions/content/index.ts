// Glue: bundle the directions data + look into the content object.

import path from "node:path";

import type { StoreShotsContent } from "@tzwzx/store-shots";

import { canvas, slides, specPanel } from "./config";
import type { Slide } from "./config";
import { renderSlideHtml } from "./template";

export const content: StoreShotsContent<Slide> = {
  // Like the showcase, everything is drawn in HTML/CSS — assets/ stays empty.
  assetsDir: path.join(import.meta.dir, "assets"),
  canvas,
  renderSlideHtml,
  slides,
  specPanel,
};
