import { afterEach, expect, test } from "bun:test";

import { findChrome } from "./chrome";

afterEach(() => {
  delete process.env.CHROME_PATH;
});

test("prefers CHROME_PATH when set", () => {
  // The test file itself always exists, so use it as a stand-in path for Chrome.
  process.env.CHROME_PATH = import.meta.path;
  expect(findChrome()).toBe(import.meta.path);
});

test("throws when CHROME_PATH points to a missing path", () => {
  process.env.CHROME_PATH = "/no/such/chrome";
  expect(() => findChrome()).toThrow();
});
