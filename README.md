# store-shots

A tiny engine for generating **App Store screenshots where the live preview _is_ the final output**.

A live preview server (open it in a browser, or drive it with Playwright) and the final PNGs
(rendered with headless Chrome) are produced by the **same `/slide/:id` route**, so what you see is
exactly what you ship — there is no drift between the preview and the submitted image.

- **Zero runtime dependencies** — only Bun built-ins and an external Chrome.
- **Bring your own look** — templates are yours; the engine only ever knows `slide.id`.

## Requirements

- Bun 1.3+
- A Chrome-family browser (auto-detected under `/Applications/...`). Point to a different binary with
  the `CHROME_PATH` environment variable (handy on CI / Linux / other machines).

## Install

```sh
bun add -E github:tzwzx/store-shots
```

## Contract (public API)

```typescript
import { runPreview, runBuild } from "store-shots";
import type { StoreShotsContent, SlideBase, RenderContext, SpecRow } from "store-shots";
```

You provide a single `content` object that satisfies `StoreShotsContent`:

```typescript
interface StoreShotsContent<TSlide extends SlideBase> {
  canvas: { height: number; width: number };
  assetsDir: string; // absolute path used to serve /assets/* and to check whether an asset exists
  slides: TSlide[]; // TSlide is free-form as long as it has { id: string }
  renderSlideHtml(slide: TSlide, ctx: RenderContext): string; // the one and only render point
  specPanel?(slide: TSlide): SpecRow[]; // optional spec table shown in the gallery
}
```

## Minimal skeleton

`content/config.ts`:

```typescript
import type { SlideBase } from "store-shots";

export interface Slide extends SlideBase {
  pr: string;
}

export const canvas = { height: 2688, width: 1242 };
export const slides: Slide[] = [{ id: "1", pr: "Hello." }];
```

`content/template.ts`:

```typescript
import { canvas } from "./config";
import type { Slide } from "./config";
import type { RenderContext } from "store-shots";

export const renderSlideHtml = (slide: Slide, ctx: RenderContext): string => {
  const screen = ctx.asset(`${slide.id}.png`);
  const img = screen.exists ? `<img src="${screen.url}" />` : "no asset";
  return `<!doctype html><html><body>
    <div class="canvas" style="width:${canvas.width}px;height:${canvas.height}px">
      <h1>${slide.pr}</h1>${img}
    </div></body></html>`;
};
```

`content/index.ts`:

```typescript
import { join } from "node:path";
import { canvas, slides } from "./config";
import { renderSlideHtml } from "./template";
import type { Slide } from "./config";
import type { StoreShotsContent } from "store-shots";

export const content: StoreShotsContent<Slide> = {
  assetsDir: join(import.meta.dir, "assets"),
  canvas,
  renderSlideHtml,
  slides,
};
```

`index.ts` (composition root / CLI):

```typescript
import { join } from "node:path";
import { content } from "./content";
import { runBuild, runPreview } from "store-shots";

const [command, ...rest] = process.argv.slice(2);
if (command === "preview") {
  runPreview(content, { port: 4317 });
} else {
  await runBuild(content, { ids: rest, outputDir: join(import.meta.dir, "output") });
}
```

`package.json`:

```json
{
  "scripts": {
    "store:preview": "bun --watch index.ts preview",
    "store:build": "bun index.ts build"
  }
}
```

## Commands

- `bun run store:preview` — live preview at `http://localhost:4317` (`/` gallery, `/slide/<id>` single)
- `bun run store:build [id...]` — writes `output/*.png` + `output/index.html` (a contact sheet)

## How it works

`renderSlideHtml` is the single render point. The preview server and the build step both hit
`/slide/:id`, so the gallery thumbnails, the single view, and the final PNG are always the same
render — there is no separate "thumbnail" code path that could drift. Your `renderSlideHtml` can be
as rich as you like (device frames, gradient glows, floating cards, OCR-friendly layouts, …); the
engine never looks inside it.

## License

[MIT](./LICENSE)
