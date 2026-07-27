// Used by build. Starts a server on an ephemeral port and screenshots the same /slide/:id with Chrome.

import { mkdirSync } from "node:fs";
import path from "node:path";

import { findChrome } from "./chrome";
import { assertCanvasSize } from "./png";
import { runPool } from "./pool";
import { createServer } from "./server";
import type { Canvas, SlideBase, StoreShotsContent } from "./types";

// Headless Chrome instances are independent processes; a small pool keeps the
// build fast on multi-slide contents without exhausting memory.
const DEFAULT_CONCURRENCY = 4;

const captureOne = async (
  chrome: string,
  url: string,
  outputPath: string,
  canvas: Canvas
): Promise<void> => {
  // Use async spawn. The server runs in the same process, so a synchronous spawnSync would
  // block the event loop and deadlock: the server could not answer Chrome's request.
  const proc = Bun.spawn(
    [
      chrome,
      "--headless=new",
      "--disable-gpu",
      "--force-device-scale-factor=1",
      `--window-size=${canvas.width},${canvas.height}`,
      "--hide-scrollbars",
      "--virtual-time-budget=3000",
      `--screenshot=${outputPath}`,
      url,
    ],
    { stderr: "pipe", stdout: "ignore" }
  );
  await proc.exited;
  if (proc.exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`Capture failed: ${url}\n${stderr}`);
  }
  assertCanvasSize(outputPath, canvas);
};

export const captureSlides = async <TSlide extends SlideBase>(
  content: StoreShotsContent<TSlide>,
  options: { concurrency?: number; ids: string[]; outputDir: string }
): Promise<string[]> => {
  const known = new Set(content.slides.map((slide) => slide.id));
  const unknown = options.ids.filter((id) => !known.has(id));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown slide id(s): ${unknown.join(", ")}. ` +
        `Known ids: ${[...known].join(", ")}`
    );
  }
  const targets =
    options.ids.length > 0
      ? content.slides.filter((slide) => options.ids.includes(slide.id))
      : content.slides;

  const chrome = findChrome();
  mkdirSync(options.outputDir, { recursive: true });

  const server = createServer(content, { port: 0 });
  try {
    return await runPool(
      targets,
      options.concurrency ?? DEFAULT_CONCURRENCY,
      async (slide) => {
        const outputPath = path.join(options.outputDir, `${slide.id}.png`);
        await captureOne(
          chrome,
          `http://127.0.0.1:${server.port}/slide/${slide.id}`,
          outputPath,
          content.canvas
        );
        console.log(`✅ ${slide.id} → ${slide.id}.png`);
        return slide.id;
      }
    );
  } finally {
    server.stop(true);
  }
};
