import { expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { assertCanvasSize, readPngSize } from "../src/png";

// Minimal PNG header: 8-byte signature + IHDR length + "IHDR" + width + height.
const pngHeader = (width: number, height: number): Uint8Array => {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 13);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
};

const withTempFile = (
  content: Uint8Array,
  run: (filePath: string) => void
): void => {
  const dir = mkdtempSync(path.join(tmpdir(), "store-shots-png-"));
  const filePath = path.join(dir, "sample.png");
  writeFileSync(filePath, content);
  try {
    run(filePath);
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
};

test("readPngSize reads width and height from the IHDR chunk", () => {
  withTempFile(pngHeader(1320, 2868), (filePath) => {
    expect(readPngSize(filePath)).toEqual({ height: 2868, width: 1320 });
  });
});

test("readPngSize returns null for a non-PNG file", () => {
  withTempFile(new TextEncoder().encode("not a png at all, sorry"), (file) => {
    expect(readPngSize(file)).toBeNull();
  });
});

test("readPngSize returns null for a truncated file", () => {
  withTempFile(new Uint8Array([0x89, 0x50]), (filePath) => {
    expect(readPngSize(filePath)).toBeNull();
  });
});

test("readPngSize returns null when the file does not exist", () => {
  expect(readPngSize("/tmp/store-shots-definitely-missing.png")).toBeNull();
});

test("assertCanvasSize passes when the PNG matches the canvas", () => {
  withTempFile(pngHeader(1320, 2868), (filePath) => {
    expect(() =>
      assertCanvasSize(filePath, { height: 2868, width: 1320 })
    ).not.toThrow();
  });
});

test("assertCanvasSize throws a descriptive error on a size mismatch", () => {
  withTempFile(pngHeader(1290, 2796), (filePath) => {
    expect(() =>
      assertCanvasSize(filePath, { height: 2868, width: 1320 })
    ).toThrow(/expected 1320x2868.*got 1290x2796/u);
  });
});
