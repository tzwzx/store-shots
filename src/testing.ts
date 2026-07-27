// Test double for templates. Optional: import from "store-shots/testing".
// Lets content-side tests exercise renderSlideHtml without a running server.

import type { RenderContext } from "./types";

/**
 * Build a RenderContext for unit tests. `exists` is either a fixed answer for
 * every asset or a per-path predicate; URLs mirror the real server (/assets/*).
 */
export const makeTestContext = (
  options: { exists?: boolean | ((relPath: string) => boolean) } = {}
): RenderContext => {
  const { exists = false } = options;
  return {
    asset: (relPath) => ({
      exists: typeof exists === "function" ? exists(relPath) : exists,
      url: `/assets/${relPath}`,
    }),
  };
};
