import { afterAll, beforeAll, expect, test } from "bun:test";

import { GlobalRegistrator } from "@happy-dom/global-registrator";

import { createServer } from "../src/server";
import { fixture } from "./fixtures";

// The test/setup.ts preload calls GlobalRegistrator.register(), which overrides Bun's native
// Response / HTTP stack, so we unregister it temporarily before starting the server.

let server: ReturnType<typeof createServer>;
let base: string;

beforeAll(async () => {
  await GlobalRegistrator.unregister();
  server = createServer(fixture, { port: 0 });
  base = `http://localhost:${server.port}`;
});

afterAll(async () => {
  server.stop(true);
  // Restore the global state for other test files (symmetric with beforeAll).
  await GlobalRegistrator.register();
});

test("GET / returns the gallery", async () => {
  const res = await fetch(`${base}/`);
  expect(res.status).toBe(200);
  expect(await res.text()).toContain("Preview");
});

test("GET /slide/:id returns a single slide", async () => {
  const res = await fetch(`${base}/slide/demo-1`);
  expect(res.status).toBe(200);
  expect(await res.text()).toContain(`class="canvas"`);
});

test("unknown slide returns 404", async () => {
  const res = await fetch(`${base}/slide/nope`);
  expect(res.status).toBe(404);
});

test("missing asset returns 404", async () => {
  const res = await fetch(`${base}/assets/demo/does-not-exist.png`);
  expect(res.status).toBe(404);
});
