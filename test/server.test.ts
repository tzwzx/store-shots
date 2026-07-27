import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { GlobalRegistrator } from "@happy-dom/global-registrator";

import { createServer, makeContext } from "../src/server";
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

test("createServer rejects duplicate slide ids", () => {
  const duplicated = {
    ...fixture,
    slides: [
      { id: "dup", title: "one" },
      { id: "dup", title: "two" },
    ],
  };
  expect(() => createServer(duplicated, { port: 0 })).toThrow(/dup/u);
});

test("ctx.asset reports PNG dimensions for existing assets", () => {
  // Minimal PNG header (signature + IHDR) is enough for the size reader.
  const png = new Uint8Array(24);
  png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  const view = new DataView(png.buffer);
  view.setUint32(8, 13);
  png.set([0x49, 0x48, 0x44, 0x52], 12);
  view.setUint32(16, 1320);
  view.setUint32(20, 2868);

  const dir = mkdtempSync(path.join(tmpdir(), "store-shots-assets-"));
  writeFileSync(path.join(dir, "screen.png"), png);
  try {
    const ctx = makeContext(dir);
    expect(ctx.asset("screen.png")).toEqual({
      exists: true,
      height: 2868,
      url: "/assets/screen.png",
      width: 1320,
    });
    expect(ctx.asset("missing.png")).toEqual({
      exists: false,
      url: "/assets/missing.png",
    });
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
});
