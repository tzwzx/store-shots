// Read PNG dimensions from the IHDR chunk. Zero dependencies: the fixed
// header layout (8-byte signature, 4-byte length, "IHDR", width, height)
// makes the first 24 bytes enough.

import { closeSync, openSync, readSync } from "node:fs";

import type { Canvas } from "./types";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const IHDR = [0x49, 0x48, 0x44, 0x52];
const HEADER_LENGTH = 24;

/** Returns the pixel size of a PNG file, or null when the file is missing or not a PNG. */
export const readPngSize = (filePath: string): Canvas | null => {
  const header = new Uint8Array(HEADER_LENGTH);
  let fd: number;
  try {
    fd = openSync(filePath, "r");
  } catch {
    return null;
  }
  try {
    if (readSync(fd, header, 0, HEADER_LENGTH, 0) < HEADER_LENGTH) {
      return null;
    }
  } finally {
    closeSync(fd);
  }
  const signatureOk =
    PNG_SIGNATURE.every((byte, index) => header[index] === byte) &&
    IHDR.every((byte, index) => header[12 + index] === byte);
  if (!signatureOk) {
    return null;
  }
  const view = new DataView(header.buffer);
  return { height: view.getUint32(20), width: view.getUint32(16) };
};

/** Throws when a generated PNG does not match the canvas exactly. */
export const assertCanvasSize = (filePath: string, canvas: Canvas): void => {
  const size = readPngSize(filePath);
  const actual = size ? `${size.width}x${size.height}` : "not a PNG";
  if (!size || size.width !== canvas.width || size.height !== canvas.height) {
    throw new Error(
      `Generated image has the wrong size: expected ${canvas.width}x${canvas.height}, got ${actual} (${filePath}). ` +
        "Check CHROME_PATH and that the browser supports --window-size / --force-device-scale-factor."
    );
  }
};
