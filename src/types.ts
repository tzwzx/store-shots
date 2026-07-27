// The single contract between the engine and the content.
// The engine depends only on the types defined here; it never sees the
// richer content-side schema (lang/bg/pr, etc.).

/** The minimum the engine requires from a slide. The richer schema is up to the content side. */
export interface SlideBase {
  id: string;
}

/** Output pixel size. Every generated PNG is exactly `width` x `height`. */
export interface Canvas {
  height: number;
  width: number;
}

/** What `ctx.asset()` returns. Exported so content-side helpers can name it. */
export interface Asset {
  exists: boolean;
  /** Intrinsic pixel height, present when the asset is an existing PNG. */
  height?: number;
  url: string;
  /** Intrinsic pixel width, present when the asset is an existing PNG. */
  width?: number;
}

/** How a template resolves assets. Both preview and build point at the same /assets/*. */
export interface RenderContext {
  asset: (relPath: string) => Asset;
}

/** A single row in the gallery's spec table. */
export interface SpecRow {
  label: string;
  value: string;
}

/** The contract that content/index.ts must satisfy. The engine depends on this alone. */
export interface StoreShotsContent<TSlide extends SlideBase = SlideBase> {
  assetsDir: string;
  canvas: Canvas;
  renderSlideHtml: (slide: TSlide, ctx: RenderContext) => string;
  slides: TSlide[];
  specPanel?: (slide: TSlide) => SpecRow[];
}
