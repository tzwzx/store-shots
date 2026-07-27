# store-shots

English | [日本語](https://github.com/tzwzx/store-shots/blob/main/README.ja.md)

A tiny engine for generating **App Store screenshots where the live preview _is_ the final output**.

A live preview server (open it in a browser, or drive it with Playwright) and the final PNGs (rendered with headless Chrome) are produced by the **same `/slide/:id` route**, so what you see is exactly what you ship — there is no drift between the preview and the submitted image.

- **Zero runtime dependencies** — only Bun built-ins and an external Chrome.
- **Bring your own look** — templates are yours; the engine only ever knows `slide.id`.

---

## What it looks like

<p>
  <img src="https://raw.githubusercontent.com/tzwzx/store-shots/main/docs/images/showcase-1.png" width="195" alt="Sample slide: Everything in one place" />
  <img src="https://raw.githubusercontent.com/tzwzx/store-shots/main/docs/images/showcase-2.png" width="195" alt="Sample slide: Thought it? Captured." />
  <img src="https://raw.githubusercontent.com/tzwzx/store-shots/main/docs/images/showcase-3.png" width="195" alt="Sample slide: Beautiful after dark" />
  <img src="https://raw.githubusercontent.com/tzwzx/store-shots/main/docs/images/showcase-4.png" width="195" alt="Sample slide: closing slide with app icon" />
</p>

These four PNGs come straight out of `runBuild` for a fictional to-do app — see [`examples/showcase`](examples/showcase). The "app screenshots" inside the device frames are drawn entirely with HTML/CSS in the template: no app, no simulator, no image assets. Reproduce them with `bun examples/showcase/index.ts build`.

The hot-reloading preview gallery (`bun examples/showcase/index.ts preview`) shows every slide next to its optional spec table, and is the exact same render you ship:

<img src="https://raw.githubusercontent.com/tzwzx/store-shots/main/docs/images/preview-gallery.png" width="820" alt="Preview gallery with spec tables" />

---

## The one idea

The engine and your content have a strict split of responsibilities. Understand this first and everything else follows:

```
your project
├─ store-shots/       ← YOU own this — keep it all in one folder (project root)
│  ├─ RUNBOOK.md               agent runbook: preview loop + asset capture workflow
│  ├─ content/
│  │  ├─ config.ts              data:  the slide list + canvas size
│  │  ├─ template.ts            look:  renderSlideHtml(slide) → a full HTML string
│  │  ├─ index.ts               glue:  combines the above into ONE `content` object
│  │  └─ assets/                images your template references via ctx.asset(...)
│  ├─ index.ts                 tiny CLI: `preview` | `build`
│  └─ output/                  generated PNGs (gitignore this)
└─ node_modules/store-shots    ← the ENGINE (this package). Serves /slide/:id, screenshots it.
                                 Knows only `slide.id`. Never sees your data shape.
```

The folder name is yours; this guide standardizes on `store-shots/` at the project root. See [Where to put it](#where-to-put-it) for how placement works.

The engine gives you two functions — `runPreview` and `runBuild` — and four types. You give it a single `content` object. That's the whole contract.

> **The golden rule:** `renderSlideHtml` is the single render point. Preview thumbnails, the single view, and the final PNG all call it. There is no second "thumbnail" code path that can drift.

---

## Requirements

- **Bun 1.3+ — store-shots is a Bun-only package.** It ships TypeScript sources that Bun runs directly (no build step); it does not run under Node.js (`node` / `npx`).
- A Chrome-family browser (Chrome / Chromium / Edge — auto-detected in the common install locations on macOS, Linux, and Windows). Point to a different binary with the `CHROME_PATH` environment variable (handy on CI or with a custom install location).

### TypeScript setup in the consuming project

Because the engine ships `.ts` sources, your project's `tsconfig.json` type-checks them together with your content. They compile cleanly when:

- `moduleResolution` is `"bundler"` (Bun's default; also common in recent Expo / Vite presets),
- `target` / `lib` include **ES2021 or later** (`replaceAll`, top-level await),
- `types` includes `"bun"` (or `"bun-types"`) — the generated CLI uses `import.meta.dir`.

If the host project must keep an incompatible config (e.g. `moduleResolution: "node16"`), add `"exclude": ["store-shots"]` to its `tsconfig.json` and type-check the folder with a nested config instead.

Other toolchain notes:

- Unused-dependency checkers (fallow, knip, depcheck) may flag `store-shots` because it is only referenced from `package.json` scripts — add it to their ignore list.
- Any tests you add under your content folder run with `bun test`; if your main runner is Jest, wire them into CI explicitly.

## Install

```sh
bun add -D -E github:tzwzx/store-shots
```

---

## Quick start

Install the engine, then scaffold a starter into your project:

```sh
bun add -D -E github:tzwzx/store-shots   # the engine (runPreview / runBuild)
bunx store-shots init                     # scaffold store-shots/ + add npm scripts
```

`init` creates a working starter under `store-shots/` (data, template, CLI, `RUNBOOK.md`, and an `assets/` folder), adds `store:preview` / `store:build` to your `package.json`, and generates `.claude/commands/store-shots.md` (Claude Code slash command that points the agent at `RUNBOOK.md`). It never overwrites existing files — pass `--force` to replace them, `--no-scripts` to skip the `package.json` edit, `--no-command` to skip the slash command, or `bunx store-shots init <dir>` to choose a different folder.

Verify the pipeline immediately — it renders placeholders until you add real screenshots:

```sh
bun run store:build            # writes output/*.png (1320x2868) + output/index.html
bun run store:preview          # live preview at http://localhost:4317
bun run store:build 1 2        # build only specific slide ids
```

Then make it yours: edit `content/config.ts` (your copy + slide list) and `content/template.ts` (your look), and drop screenshots into `content/assets/`. See the [Authoring guide](#authoring-guide).

---

## Using with AI agents

store-shots is built to be driven by an AI coding agent. Claude Code gets a ready-made command out of the box; any other agent runs the same loop through `RUNBOOK.md`.

### Claude Code

With Claude Code, the entire workflow is:

```sh
bun add -D -E github:tzwzx/store-shots   # 1. install the engine
bunx store-shots init                     # 2. scaffold (also generates the /store-shots command)
```

```text
/store-shots                              # 3. run the loop inside Claude Code
```

`init` writes `.claude/commands/store-shots.md`, so `/store-shots` points the agent at your `store-shots/RUNBOOK.md` and it takes over: start the preview, review the gallery, refine `config.ts` / `template.ts`, capture missing assets from the booted simulator per the runbook, and finish with `store:build`. Pass an argument to scope the run:

```text
/store-shots recapture screen-c (jp)
/store-shots rewrite the copy on slide 2
```

Two things make the loop work well:

1. **Fill in `RUNBOOK.md` once** — simulator device, test IDs, per-screen capture steps. The runbook is the contract the agent follows; the more concrete it is, the less it asks.
2. **Keep copy in `config.ts`** — the agent can then iterate on wording and layout separately, and the gallery's spec table lets it cross-check the rendered text.

### Other agents (Cursor, Codex, Gemini CLI, …)

The `/store-shots` command is just a pointer at `RUNBOOK.md` — any agent that can read files runs the same loop. Add one note to whatever file your tool loads into every session (`AGENTS.md`, a Cursor rule, `GEMINI.md`, …):

> Store screenshots live in `store-shots/`. For any request about them, read `store-shots/RUNBOOK.md` and follow it end to end (preview → critique → refine → capture → build).

To scaffold a project from scratch, point the agent at the [Checklist for AI agents](#checklist-for-ai-agents) instead.

---

## Where to put it

`store-shots init` scaffolds exactly this layout for you at the **project root**. Everything lives in **one dedicated folder** so it never tangles with your app's source. This guide standardizes on `store-shots/` (matching the package name), but the name is yours — pass it to init as `bunx store-shots init <dir>`:

```
store-shots/
  RUNBOOK.md         agent runbook: preview loop + asset capture workflow (Maestro)
  content/
    config.ts        data:   Slide type, slides[], canvas
    template.ts      look:   renderSlideHtml(slide, ctx) → HTML
    index.ts         glue:   the StoreShotsContent object
    assets/          images: referenced by ctx.asset("relative/path.png")
      icon.png
      jp/screen-a.png
      en/screen-a.png
  index.ts           CLI:    preview | build
  output/            generated: *.png + index.html (gitignore this)
```

**Why a dedicated folder:** generated `output/` is easy to gitignore, the engine's wiring stays out of your app's source tree, and the whole tool is trivial to move or delete.

**It works anywhere** — nothing is hard-coded to a location. Placement is decided by just three things:

| What | Where it's set | How |
| --- | --- | --- |
| Asset source dir | `assetsDir` in `content/index.ts` | `join(import.meta.dir, "assets")` — travels with `content/` |
| PNG output dir | `outputDir` in the CLI | `join(import.meta.dir, "output")` — travels with the CLI |
| CLI entry path | the `store:*` scripts in `package.json` | the only absolute reference |

Because `assetsDir`/`outputDir` are relative to `import.meta.dir`, you can move the whole folder and only the `package.json` script paths need updating.

> Already keeping it on a different path (e.g. a legacy `scripts/store-shots/`)? It keeps working as-is — only the `store:*` script paths in `package.json` need to match.

---

## Authoring guide

`init` gives you a working starter, so this is about making it yours: you're **editing the generated `content/config.ts` and `content/template.ts`**, not creating them from scratch.

### 1. `content/config.ts` — your data

- `Slide` **must** extend `SlideBase` (i.e. have a string `id`). Everything else is yours: language, background colors, headline text, badges, whatever your template needs.
- `canvas` is the output pixel size. Every PNG comes out at exactly `canvas.width × canvas.height`.
- `slides` is the ordered list. Each `id` becomes the route `/slide/<id>` and the file `<id>.png`.
- Keep `config.ts` the single source of truth for copy and layout data, so a non-designer can edit wording without touching the template.

### 2. `content/template.ts` — your look

`renderSlideHtml(slide, ctx)` returns a **complete HTML document** (start at `<!doctype html>`) for one slide. Tips:

- Wrap everything in a root element sized to the canvas (`width: ${canvas.width}px; height: ${canvas.height}px; overflow: hidden`). Anything outside is cropped.
- Resolve images through `ctx.asset(relPath)` — never hard-code `/assets/...`. It returns `{ exists, url }`. Use `exists` to render a placeholder so layout is reviewable before art is ready.
- Use `object-fit: cover` for screenshots so a device frame stays filled even if the source aspect ratio differs slightly.
- It's plain HTML/CSS rendered by Chrome — flexbox, gradients, `transform`, web fonts, SVG all work.

### 3. `content/assets/` — your images

- The engine serves this directory at `/assets/*` and checks file existence. **The file names are entirely up to you** — they only need to match the `relPath` you pass to `ctx.asset(...)`.
- Example convention: `ctx.asset(`${slide.lang}/screen-${slide.screen}.png`)` ⇒ files live at `assets/jp/screen-a.png`, `assets/en/screen-a.png`, etc.
- Missing files are fine: they render as whatever placeholder your template draws.
- **How to produce the screenshots:** `init` scaffolds `RUNBOOK.md` with a reference workflow — booted iOS Simulator + Maestro driven directly by an AI agent (no dedicated capture script in the package). Edit the runbook for your app's test IDs and per-screen steps — or rewrite it for your platform (Android emulator, Playwright for web, manual capture); drop finished PNGs into `assets/`.

### 4 & 5. `content/index.ts` and the CLI

`init` generates these for you; you rarely touch them. `content/index.ts` bundles your pieces into a `StoreShotsContent`. The CLI maps `preview`/`build` to `runPreview`/`runBuild`.

---

## The asset workflow

```
1. Edit the generated config.ts + template.ts (they already include a placeholder branch).
2. bun run store:preview  → open http://localhost:4317, refine layout & copy (hot reloads).
3. Capture real screenshots per RUNBOOK.md (simulator + Maestro) into content/assets/.
4. Refresh the preview to verify the real art fits the frame.
5. bun run store:build    → output/*.png (submit these) + output/index.html (a contact sheet).
```

Because preview and build share one render path, step 5 always matches what you saw in step 4.

---

## API reference

```typescript
import { runPreview, runBuild, CANVAS, expandSlides } from "store-shots";
import type {
  StoreShotsContent,
  SlideBase,
  RenderContext,
  Asset,
  Canvas,
  SpecRow,
} from "store-shots";
```

| Export | Signature | Notes |
| --- | --- | --- |
| `runPreview(content, { port })` | `→ void` | Starts the hot-reloading preview server. |
| `runBuild(content, { ids, outputDir, concurrency? })` | `→ Promise<void>` | Screenshots slides to `outputDir` (up to 4 Chrome instances in parallel by default). Empty `ids` = all slides; an unknown id is an error. Every PNG is verified to be exactly `canvas`-sized. |
| `CANVAS` | preset canvases | `iphone69` (1320×2868), `iphone69Alt` (1290×2796), `iphone65` (1242×2688), `ipad13` (2064×2752). Any custom size works too — Google Play accepts a wide range. |
| `expandSlides(langs, seeds, build)` | `→ TSlide[]` | Expand language-agnostic seeds into per-language slides (see Recipes). |
| `SlideBase` | `{ id: string }` | The minimum the engine requires of a slide. Ids must be unique — the engine rejects duplicates. |
| `Canvas` | `{ height, width }` | The output pixel size. |
| `Asset` | `{ exists, url, width?, height? }` | Returned by `ctx.asset`. `width`/`height` are the intrinsic pixel size when the file is an existing PNG — handy for crop math. |
| `RenderContext` | `{ asset(relPath) → Asset }` | Passed to `renderSlideHtml`. |
| `SpecRow` | `{ label: string; value: string }` | One row of the optional gallery spec table. |
| `StoreShotsContent<TSlide>` | see below | The object you provide. |

```typescript
interface StoreShotsContent<TSlide extends SlideBase> {
  canvas: Canvas; // e.g. CANVAS.iphone69, or any custom size
  assetsDir: string; // absolute path served at /assets/*
  slides: TSlide[];
  renderSlideHtml(slide: TSlide, ctx: RenderContext): string;
  specPanel?(slide: TSlide): SpecRow[]; // optional spec table in the gallery
}
```

### Optional helpers (subpath exports)

| Import from | Export | Notes |
| --- | --- | --- |
| `store-shots/html` | `escapeHtml(text)` | HTML-escape `& < > " '` for safe interpolation. |
| `store-shots/html` | `accentHtml(line, accent)` | Escape a line and wrap every occurrence of `accent` in `<span class="accent">`. |
| `store-shots/testing` | `makeTestContext({ exists? })` | A `RenderContext` double for unit-testing templates without a server. `exists` is a boolean or a per-path predicate. |

---

## Recipes

**Multiple languages** — make `lang` part of the slide and the asset path, and expand one seed list per language with `expandSlides`:

```typescript
import { expandSlides } from "store-shots";

export interface Slide extends SlideBase {
  lang: "jp" | "en";
  screen: string;
  pr: string;
}

const seeds = [
  { pr: { en: "Everything.", jp: "ぜんぶ。" }, screen: "a" },
  { pr: { en: "One tap.", jp: "ワンタップ。" }, screen: "b" },
];

export const slides: Slide[] = expandSlides(
  ["jp", "en"] as const,
  seeds,
  (lang, seed) => ({
    id: `${lang}-${seed.screen}`,
    lang,
    pr: seed.pr[lang],
    screen: seed.screen,
  })
);

// in template.ts:
const screen = ctx.asset(`${slide.lang}/screen-${slide.screen}.png`);
```

**An accent word in the headline** — highlight a substring without hand-rolling the HTML:

```typescript
import { accentHtml } from "store-shots/html";
// "Less app. <span class="accent">More done.</span>"
const headline = accentHtml("Less app. More done.", "More done.");
// then style .accent in your CSS
```

**Crop math against the real capture** — `ctx.asset` reports the intrinsic PNG size, so a template can adapt to whatever the simulator produced:

```typescript
const screen = ctx.asset(`${slide.lang}/screen-${slide.screen}.png`);
const ratio =
  screen.width && screen.height ? screen.height / screen.width : 2.17;
```

**Google Play** — nothing is iOS-specific: set `canvas` to any size the Play Console accepts (e.g. `{ width: 1080, height: 1920 }`) and submit the same PNGs.

**Unit-test your template** — render slides against `makeTestContext` and assert on the HTML:

```typescript
import { makeTestContext } from "store-shots/testing";

const html = renderSlideHtml(slides[0], makeTestContext({ exists: true }));
expect(html).toContain("object-fit");
```

**A spec table in the gallery** (handy to cross-check rendered text against intended copy):

```typescript
// in content/index.ts, add to the content object:
specPanel: (slide) => [{ label: "headline", value: slide.pr }],
```

**An icon / closing slide with a different layout** — branch inside `renderSlideHtml` on a field (e.g. `slide.screen === "icon"`) and return a different body.

**A production-grade device-frame template** with light/dark tone system, per-language typography, multi-layer device shadows, and a placeholder fallback — see the collapsible example at the bottom.

---

## Checklist for AI agents

Follow this order to scaffold screenshots for a new project. Each step is independently verifiable.

1. **Install & scaffold**: run `bun add -D -E github:tzwzx/store-shots`, then `bunx store-shots init`. This creates `store-shots/` with a working starter, adds the `store:*` scripts, and generates `.claude/commands/store-shots.md` (`/store-shots` in Claude Code).
2. **Set the canvas size** in the generated `config.ts` (it ships as App Store 6.9" = `CANVAS.iphone69` = `1320 × 2868`; change it only if your store listing needs a different size — see the `CANVAS` presets).
3. **Model the slides** in `config.ts`: replace the example `slides[]` with your own, and extend `Slide extends SlideBase` with whatever fields your template needs. Every `id` must be unique.
4. **Customize `renderSlideHtml`** in the generated `template.ts`. It must:
   - return a full HTML document sized to `canvas`;
   - resolve every image with `ctx.asset(relPath)` (never a hard-coded `/assets/...`);
   - handle the `!screen.exists` case with a visible placeholder.
5. **`content/index.ts`** is already wired by `init` (`assetsDir` set); edit only to add `specPanel`.
6. **The CLI `index.ts` and the `store:*` scripts** are already created by `init` — nothing to do.
7. **Verify layout**: `bun run store:build` (placeholders are expected before art exists). The engine verifies every PNG is exactly `canvas.width × canvas.height` and fails the build otherwise.
8. **Capture assets** per `RUNBOOK.md` (booted simulator + Maestro) into `content/assets/`, named to match your `ctx.asset` paths.
9. **Final build**: `bun run store:build`, then review `output/index.html`.

**Common mistakes to avoid:**

- ❌ Asset path mismatch — the string in `ctx.asset("...")` must equal the real file path under `assets/`. This is the #1 cause of "image not showing".
- ❌ Canvas/CSS size mismatch — the root element's `width/height` must equal `canvas`, or content gets cropped or letterboxed.
- ❌ Returning a fragment — `renderSlideHtml` must return a full document from `<!doctype html>`.
- ❌ Forgetting the placeholder branch — without it the preview is blank before art is ready.
- ❌ Hard-coding `/assets/...` — always go through `ctx.asset` so existence checks work.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `No Chrome-family browser found` | Install Chrome, or set `CHROME_PATH=/path/to/chrome`. |
| `Generated image has the wrong size` | The browser ignored `--window-size` / `--force-device-scale-factor`. Check what `CHROME_PATH` points at; plain Chrome / Chromium / Edge all work. |
| `Duplicate slide id(s)` | Two slides share an `id`. Ids become routes and file names, so make them unique. |
| `Unknown slide id(s)` | A `store:build <id>` argument doesn't match any slide — check the id list in `config.ts`. |
| Image is blank / placeholder shows despite a file existing | The `ctx.asset(...)` path doesn't match the real file under `assets/`. |
| PNG is cropped or has empty bars | The root element size doesn't match `canvas`. |
| Preview doesn't update | `store:preview` uses `--watch`; make sure you ran it via that script and re-navigate. |
| Port already in use | Change the port in your CLI's `runPreview(content, { port })`. |

---

## Advanced: a production-grade template

<details>
<summary>A complete device-frame template (light/dark tones, per-language type, placeholders). Copy and adapt.</summary>

This is the shape used in a real shipping app, generalized. It demonstrates: deriving per-slide style from a single `screen` key, a light/dark tone system, per-language typography, multi-layer device shadows, and an alternate "icon" layout for a closing slide. Swap the colors, copy, and `screen` enum for your app.

**`content/config.ts`**

```typescript
import { CANVAS } from "store-shots";
import type { SlideBase, SpecRow } from "store-shots";

// Screen identity. `icon` is the closing slide with a different layout.
export type Screen = "a" | "b" | "c" | "d" | "icon";

export interface Slide extends SlideBase {
  lang: "jp" | "en";
  screen: Screen;
  tone: "light" | "dark"; // derived
  bg: [string, string]; // background gradient [top, bottom] (derived)
  frame: "silver" | "black" | "none"; // device frame color (derived)
  badge?: string;
  pr: { lines: string[]; accent: string }; // only the `accent` substring is highlighted
  sub: string[]; // one element = one line
}

// Light/dark rhythm keyed by screen. Bright screens stay light; "hero" moments go dark.
const SCREEN_STYLE: Record<
  Screen,
  { bg: [string, string]; tone: "light" | "dark" }
> = {
  a: { bg: ["#EAF3FF", "#C7DCFB"], tone: "light" },
  b: { bg: ["#E7F4FB", "#C2E2F2"], tone: "light" },
  c: { bg: ["#101D3E", "#070D20"], tone: "dark" },
  d: { bg: ["#EEEFFF", "#CFD7FB"], tone: "light" },
  icon: { bg: ["#122A56", "#0A1838"], tone: "dark" },
};

const deriveFrame = (
  screen: Screen,
  tone: "light" | "dark"
): Slide["frame"] => {
  if (screen === "icon") {
    return "none";
  }
  return tone === "dark" ? "black" : "silver";
};

type SlideSeed = Omit<Slide, "bg" | "frame" | "tone">;
const styled = (seed: SlideSeed): Slide => {
  const { bg, tone } = SCREEN_STYLE[seed.screen];
  return { ...seed, bg, frame: deriveFrame(seed.screen, tone), tone };
};

const baseSlides: SlideSeed[] = [
  {
    badge: "Free",
    id: "en-1",
    lang: "en",
    pr: { accent: "One screen.", lines: ["Everything.", "One screen."] },
    screen: "a",
    sub: ["Every list. Every errand."],
  },
  {
    id: "en-2",
    lang: "en",
    pr: { accent: "Noted.", lines: ["Thought it? Noted."] },
    screen: "b",
    sub: ["Quick capture. Tap and type."],
  },
  {
    id: "en-3",
    lang: "en",
    pr: { accent: "after dark.", lines: ["Beautiful after dark."] },
    screen: "c",
    sub: ["Automatic dark mode."],
  },
  {
    id: "en-4",
    lang: "en",
    pr: { accent: "More done.", lines: ["Less app. More done."] },
    screen: "icon",
    sub: ["Completely free."],
  },
];

export const slides: Slide[] = baseSlides.map(styled);

// This example's absolute layout constants target 1242x2688 (6.5").
export const canvas = CANVAS.iphone65;

export const specPanel = (slide: Slide): SpecRow[] => {
  const rows: SpecRow[] = [
    { label: "PR", value: slide.pr.lines.join(" / ") },
    { label: "sub", value: slide.sub.join(" / ") },
    { label: "tone", value: slide.tone },
    { label: "bg", value: `${slide.bg[0]} → ${slide.bg[1]}` },
  ];
  if (slide.badge) {
    rows.push({ label: "badge", value: slide.badge });
  }
  return rows;
};
```

**`content/template.ts`**

```typescript
import type { Asset, RenderContext } from "store-shots";
import { accentHtml, escapeHtml } from "store-shots/html";

import { canvas } from "./config";
import type { Slide } from "./config";

// Float the device off the bottom and scale it down so text has a stable zone above it.
const DEVICE_HEIGHT = 2038;
const DEVICE_SCALE = 0.92;
const DEVICE_BOTTOM = 84;
const CONTENT_ZONE = Math.round(
  canvas.height - DEVICE_BOTTOM - DEVICE_HEIGHT * DEVICE_SCALE
);

// Wrap the `accent` substring of each PR line in <span class="accent">.
const renderPrLines = (lines: string[], accent: string): string =>
  lines.map((line) => `<div>${accentHtml(line, accent)}</div>`).join("");

// Per-language typography tokens.
interface LangTokens {
  fontFamily: string;
  prLetterSpacing: string;
  prLineRatio: number;
  prWeight: number;
  subWeight: number;
}
const JA_TOKENS: LangTokens = {
  fontFamily: `"Hiragino Sans", sans-serif`,
  prLetterSpacing: "-0.01em",
  prLineRatio: 1.42,
  prWeight: 700,
  subWeight: 500,
};
const EN_TOKENS: LangTokens = {
  fontFamily: `-apple-system, "SF Pro Display", "Helvetica Neue", sans-serif`,
  prLetterSpacing: "-0.022em",
  prLineRatio: 1.16,
  prWeight: 800,
  subWeight: 500,
};

// Per-tone color tokens (contrast flips with the background).
interface ToneTokens {
  accent: string;
  badgeBg: string;
  badgeFg: string;
  textMain: string;
  textSub: string;
}
const LIGHT_TOKENS: ToneTokens = {
  accent: "#1567DC",
  badgeBg: "#1567DC",
  badgeFg: "#FFFFFF",
  textMain: "#0B2545",
  textSub: "rgba(11, 37, 69, 0.62)",
};
const DARK_TOKENS: ToneTokens = {
  accent: "#5CC0FF",
  badgeBg: "#5CC0FF",
  badgeFg: "#06182E",
  textMain: "#FFFFFF",
  textSub: "rgba(255, 255, 255, 0.74)",
};

const frameBackgroundCss = (frame: Slide["frame"]): string =>
  frame === "black"
    ? "linear-gradient(150deg, #54565a, #2c2e31 46%, #45474a)"
    : "linear-gradient(150deg, #f1f2f5, #c1c4ca 46%, #e3e5e9)";

const screenContentHtml = (slide: Slide, screen: Asset): string => {
  if (screen.exists) {
    return `<img src="${screen.url}" alt="" />`;
  }
  return `<div class="ph">screen-${slide.screen}.png<br />missing</div>`;
};

const iconBodyHtml = (slide: Slide, screen: Asset): string => {
  const icon = screen.exists
    ? `<img class="app-icon" src="${screen.url}" alt="" />`
    : `<div class="app-icon icon-ph">icon.png<br />missing</div>`;
  const sub = slide.sub
    .map((line) => `<div>${escapeHtml(line)}</div>`)
    .join("");
  return `
      <div class="pr pr-abs">${renderPrLines(slide.pr.lines, slide.pr.accent)}</div>
      ${icon}
      <div class="sub sub-abs">${sub}</div>`;
};

const standardBodyHtml = (slide: Slide, screen: Asset): string => {
  const badge = slide.badge
    ? `<div class="badge">${escapeHtml(slide.badge)}</div>`
    : "";
  const sub = slide.sub
    .map((line) => `<div>${escapeHtml(line)}</div>`)
    .join("");
  return `
      <div class="content">
        <div class="pr">${renderPrLines(slide.pr.lines, slide.pr.accent)}</div>
        <div class="sub">${sub}</div>
        ${badge}
      </div>
      <div class="device">
        <div class="bezel"><div class="screen">${screenContentHtml(slide, screen)}</div></div>
      </div>`;
};

export const renderSlideHtml = (slide: Slide, ctx: RenderContext): string => {
  const isJa = slide.lang === "jp";
  const isDark = slide.tone === "dark";
  const isIcon = slide.screen === "icon";

  const lang = isJa ? JA_TOKENS : EN_TOKENS;
  const tokens = isDark ? DARK_TOKENS : LIGHT_TOKENS;
  const prSize = slide.screen === "a" ? 100 : 88;
  const prLine = Math.round(prSize * lang.prLineRatio);

  // Both preview and build resolve assets through /assets/*; missing files fall back to a placeholder.
  const relPath = isIcon
    ? "icon.png"
    : `${slide.lang}/screen-${slide.screen}.png`;
  const screen = ctx.asset(relPath);

  const frameBackground = frameBackgroundCss(slide.frame);
  const body = isIcon
    ? iconBodyHtml(slide, screen)
    : standardBodyHtml(slide, screen);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${canvas.width}px; height: ${canvas.height}px; }
  .canvas {
    position: relative;
    width: ${canvas.width}px; height: ${canvas.height}px;
    overflow: hidden;
    background: linear-gradient(168deg, ${slide.bg[0]}, ${slide.bg[1]});
    font-family: ${lang.fontFamily};
  }
  .content {
    position: absolute; top: 0; left: 100px;
    width: 1042px; height: ${CONTENT_ZONE}px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 28px; padding: 96px 0 28px;
  }
  .pr {
    font-size: ${prSize}px; line-height: ${prLine}px; font-weight: ${lang.prWeight};
    letter-spacing: ${lang.prLetterSpacing}; color: ${tokens.textMain}; text-align: center;
  }
  .pr .accent { color: ${tokens.accent}; }
  .sub {
    font-size: 42px; line-height: 56px; font-weight: ${lang.subWeight};
    color: ${tokens.textSub}; text-align: center;
  }
  .badge {
    margin-top: 6px; padding: 17px 40px;
    background: ${tokens.badgeBg}; color: ${tokens.badgeFg};
    font-size: 41px; font-weight: ${lang.prWeight}; border-radius: 999px;
  }
  .device {
    position: absolute; left: 136px; bottom: ${DEVICE_BOTTOM}px;
    width: 970px; height: ${DEVICE_HEIGHT}px;
    transform: scale(${DEVICE_SCALE}); transform-origin: bottom center;
    padding: 6px; border-radius: 150px; background: ${frameBackground};
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4), 0 48px 100px rgba(0, 0, 0, 0.5);
  }
  .bezel { width: 100%; height: 100%; padding: 16px; border-radius: 144px; background: #060606; }
  .screen {
    position: relative; width: 100%; height: 100%;
    border-radius: 128px; overflow: hidden; background: #F4F7FD;
  }
  .screen img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: top center; }
  .screen .ph {
    width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    font-size: 44px; line-height: 64px; text-align: center; color: #6B7A99;
  }
  .pr-abs { position: absolute; top: 900px; left: 100px; width: 1042px; }
  .app-icon {
    position: absolute; left: 406px; top: 1140px;
    width: 430px; height: 430px; border-radius: 96px;
    box-shadow: 0 34px 72px rgba(0, 0, 0, 0.5);
  }
  .icon-ph {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: linear-gradient(160deg, #1E6FCC, #58BCFE); color: #fff;
    font-size: 40px; line-height: 56px; text-align: center;
  }
  .sub-abs { position: absolute; top: 1700px; left: 100px; width: 1042px; }
</style>
</head>
<body>
  <div class="canvas">${body}</div>
</body>
</html>`;
};
```

</details>

---

## How it works

`renderSlideHtml` is the single render point. The preview server and the build step both hit `/slide/:id`, so the gallery thumbnails, the single view, and the final PNG are always the same render — there is no separate "thumbnail" code path that could drift. Your `renderSlideHtml` can be as rich as you like (device frames, gradient glows, floating cards, OCR-friendly layouts, …); the engine never looks inside it.

## License

[MIT](./LICENSE)
