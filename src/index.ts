// Public API of the engine. Pass a content object to run preview / build.

import { captureSlides } from "./capture";
import { writeContactSheet } from "./contact-sheet";
import { createServer } from "./server";
import type { SlideBase, StoreShotsContent } from "./types";

export type {
  RenderContext,
  SlideBase,
  SpecRow,
  StoreShotsContent,
} from "./types";

export const runPreview = <TSlide extends SlideBase>(
  content: StoreShotsContent<TSlide>,
  options: { port: number }
): void => {
  const server = createServer(content, options);
  console.log(`🌐 Preview: ${server.url}`);
  console.log(`   Gallery ${server.url}  /  Single ${server.url}slide/<id>`);
};

export const runBuild = async <TSlide extends SlideBase>(
  content: StoreShotsContent<TSlide>,
  options: { ids: string[]; outputDir: string }
): Promise<void> => {
  const captured = await captureSlides(content, options);
  await writeContactSheet(options.outputDir, captured);
  console.log(
    `\n🎉 Generated ${captured.length} image(s) + index.html in ${options.outputDir}`
  );
};
