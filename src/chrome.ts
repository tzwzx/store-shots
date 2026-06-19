// Locate the executable path of a Chrome-family browser.

import { existsSync } from "node:fs";

const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
];

export const findChrome = (): string => {
  // CHROME_PATH takes precedence when set (CI / other OSes / other machines).
  const override = process.env.CHROME_PATH;
  if (override) {
    if (!existsSync(override)) {
      throw new Error(`CHROME_PATH points to a path that does not exist: ${override}`);
    }
    return override;
  }
  const found = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(
      "No Chrome-family browser found. Set CHROME_PATH or add a path to CHROME_CANDIDATES.",
    );
  }
  return found;
};
