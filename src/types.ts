// The single contract between the engine and the content.
// The engine depends only on the types defined here; it never sees the
// richer content-side schema (lang/bg/pr, etc.).

/** The minimum the engine requires from a slide. The richer schema is up to the content side. */
export interface SlideBase {
  id: string;
}

/** How a template resolves assets. Both preview and build point at the same /assets/*. */
export interface RenderContext {
  asset: (relPath: string) => { exists: boolean; url: string };
}

/** A single row in the gallery's spec table. */
export interface SpecRow {
  label: string;
  value: string;
}

/** The contract that content/index.ts must satisfy. The engine depends on this alone. */
export interface StoreShotsContent<TSlide extends SlideBase = SlideBase> {
  assetsDir: string;
  canvas: { height: number; width: number };
  renderSlideHtml: (slide: TSlide, ctx: RenderContext) => string;
  slides: TSlide[];
  specPanel?: (slide: TSlide) => SpecRow[];
}
