// Canvas presets for the portrait sizes App Store Connect accepts.
// Pass one as `canvas` in your content, or spell out any size by hand
// (Google Play accepts a wide range of sizes, so any canvas works there).

import type { Canvas } from "./types";

export const CANVAS = {
  /** iPad 13" display. */
  ipad13: { height: 2752, width: 2064 },
  /** iPhone 6.5" display (e.g. iPhone 11 Pro Max). */
  iphone65: { height: 2688, width: 1242 },
  /** iPhone 6.9" display (e.g. iPhone 16 Pro Max). */
  iphone69: { height: 2868, width: 1320 },
  /** Alternate size App Store Connect accepts in the 6.9" slot. */
  iphone69Alt: { height: 2796, width: 1290 },
} as const satisfies Record<string, Canvas>;
