import { expect, test } from "bun:test";

import { runPool } from "../src/pool";

test("runPool preserves input order in its results", async () => {
  const results = await runPool([3, 1, 2], 2, async (item) => {
    await Bun.sleep(item * 5);
    return item * 10;
  });
  expect(results).toEqual([30, 10, 20]);
});

test("runPool never runs more workers than the limit", async () => {
  let active = 0;
  let peak = 0;
  await runPool([1, 2, 3, 4, 5, 6], 2, async () => {
    active += 1;
    peak = Math.max(peak, active);
    await Bun.sleep(5);
    active -= 1;
  });
  expect(peak).toBeLessThanOrEqual(2);
  expect(peak).toBeGreaterThan(1);
});

test("runPool rejects when a worker throws", async () => {
  await expect(
    runPool([1, 2], 2, (item) => {
      if (item === 2) {
        return Promise.reject(new Error("boom"));
      }
      return Promise.resolve(item);
    })
  ).rejects.toThrow("boom");
});
