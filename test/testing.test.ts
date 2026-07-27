import { expect, test } from "bun:test";

import type { Asset } from "../src/index";
import { makeTestContext } from "../src/testing";

test("makeTestContext defaults to every asset missing", () => {
  const ctx = makeTestContext();
  expect(ctx.asset("icon.png")).toEqual({
    exists: false,
    url: "/assets/icon.png",
  });
});

test("makeTestContext can mark every asset as existing", () => {
  const ctx = makeTestContext({ exists: true });
  expect(ctx.asset("jp/screen-a.png").exists).toBe(true);
});

test("makeTestContext accepts a per-path predicate", () => {
  const ctx = makeTestContext({
    exists: (relPath) => relPath.endsWith(".png"),
  });
  expect(ctx.asset("a.png").exists).toBe(true);
  expect(ctx.asset("a.jpg").exists).toBe(false);
});

test("the Asset type is exported from the package root", () => {
  // Compile-time check: consumers can annotate helpers with Asset instead of
  // re-declaring the shape by hand.
  const sample: Asset = { exists: true, url: "/assets/x.png" };
  expect(sample.url).toBe("/assets/x.png");
});
