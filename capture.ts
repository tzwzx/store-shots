// Used by build. Starts a server on an ephemeral port and screenshots the same /slide/:id with Chrome.

import { mkdirSync } from "node:fs";
import path from "node:path";

import { findChrome } from "./chrome";
import { createServer } from "./server";
import type { SlideBase, StoreShotsContent } from "./types";

const captureOne = async (
  chrome: string,
  url: string,
  outputPath: string,
  canvas: { height: number; width: number },
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
    { stderr: "pipe", stdout: "ignore" },
  );
  await proc.exited;
  if (proc.exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`Capture failed: ${url}\n${stderr}`);
  }
};

export const captureSlides = async <TSlide extends SlideBase>(
  content: StoreShotsContent<TSlide>,
  options: { ids: string[]; outputDir: string },
): Promise<string[]> => {
  const targets =
    options.ids.length > 0
      ? content.slides.filter((slide) => options.ids.includes(slide.id))
      : content.slides;
  if (targets.length === 0) {
    throw new Error(`No slides matched the given IDs: ${options.ids.join(", ")}`);
  }

  const chrome = findChrome();
  mkdirSync(options.outputDir, { recursive: true });

  const server = createServer(content, { port: 0 });
  const captured: string[] = [];
  try {
    for (const slide of targets) {
      const outputPath = path.join(options.outputDir, `${slide.id}.png`);
      // oxlint-disable-next-line no-await-in-loop -- capture one at a time while keeping the server alive
      await captureOne(
        chrome,
        `http://127.0.0.1:${server.port}/slide/${slide.id}`,
        outputPath,
        content.canvas,
      );
      captured.push(slide.id);
      console.log(`✅ ${slide.id} → ${slide.id}.png`);
    }
  } finally {
    server.stop(true);
  }
  return captured;
};
