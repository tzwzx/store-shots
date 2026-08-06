// CLI entry for the directions sampler (README images: docs/images/direction-*.png).
// Usage:
//   bun examples/directions/index.ts preview        live preview at :4318
//   bun examples/directions/index.ts build [id...]  write output/*.png

import path from "node:path";

import { runBuild, runPreview } from "@tzwzx/store-shots";

import { content } from "./content";

const OUTPUT_DIR = path.join(import.meta.dir, "output");
const DEFAULT_PORT = 4318;

const [command, ...rest] = process.argv.slice(2);

if (command === "preview") {
  runPreview(content, { port: Number(process.env.PORT) || DEFAULT_PORT });
} else if (command === "build" || command === undefined) {
  await runBuild(content, { ids: rest, outputDir: OUTPUT_DIR });
} else {
  console.error(`Unknown subcommand: ${command} (preview | build)`);
  process.exit(1);
}
