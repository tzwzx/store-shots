// Preview server. The only place that calls renderSlideHtml, so preview and build hit the same routes.

import { existsSync } from "node:fs";
import path from "node:path";

import { renderGallery } from "./gallery";
import type { RenderContext, SlideBase, StoreShotsContent } from "./types";

// no-store: never let the browser cache the preview, so a reload always shows the latest render.
const HTML_HEADERS = { "cache-control": "no-store", "content-type": "text/html; charset=utf-8" };

// Shared asset resolution for preview / build. Returns /assets/<relPath> and only checks existence.
const makeContext = (assetsDir: string): RenderContext => ({
  asset: (relPath) => ({
    exists: existsSync(path.join(assetsDir, relPath)),
    url: `/assets/${relPath}`,
  }),
});

export const createServer = <TSlide extends SlideBase>(
  content: StoreShotsContent<TSlide>,
  options: { port: number },
) => {
  const ctx = makeContext(content.assetsDir);
  return Bun.serve({
    fetch() {
      return new Response("Not Found", { status: 404 });
    },
    port: options.port,
    routes: {
      "/": () => new Response(renderGallery(content), { headers: HTML_HEADERS }),
      "/assets/*": (req) => {
        // In Bun 1.3.x the wildcard is not populated in req.params["*"], so read it from the URL.
        const relPath = new URL(req.url).pathname.slice("/assets/".length);
        const filePath = path.join(content.assetsDir, relPath);
        if (!existsSync(filePath)) {
          return new Response("Not Found", { status: 404 });
        }
        return new Response(Bun.file(filePath));
      },
      "/slide/:id": (req) => {
        const slide = content.slides.find((s) => s.id === req.params.id);
        if (!slide) {
          return new Response("Not Found", { status: 404 });
        }
        return new Response(content.renderSlideHtml(slide, ctx), { headers: HTML_HEADERS });
      },
    },
  });
};
