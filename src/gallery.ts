// Overview gallery of every slide. Each thumbnail loads /slide/:id in an iframe and only shrinks
// it with CSS, so its render matches the single view and the final PNG (no separate thumbnail render).

import type { SlideBase, StoreShotsContent } from "./types";

const THUMB_WIDTH = 280;

const escapeHtml = (text: string): string =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const renderSpecRows = <T extends SlideBase>(content: StoreShotsContent<T>, slide: T): string => {
  const { specPanel } = content;
  if (!specPanel) {
    return "";
  }
  return specPanel(slide)
    .map((row) => `<tr><th>${escapeHtml(row.label)}</th><td>${escapeHtml(row.value)}</td></tr>`)
    .join("");
};

const renderCell = <T extends SlideBase>(content: StoreShotsContent<T>, slide: T): string => {
  const scale = THUMB_WIDTH / content.canvas.width;
  const thumbHeight = content.canvas.height * scale;
  return `<figure class="cell">
		<div class="frame" style="width: ${THUMB_WIDTH}px; height: ${thumbHeight}px;">
			<iframe src="/slide/${slide.id}" width="${content.canvas.width}" height="${content.canvas.height}"
				style="transform: scale(${scale}); transform-origin: top left; border: 0;"></iframe>
		</div>
		<figcaption>
			<div class="cell-id">${escapeHtml(slide.id)}</div>
			<table>${renderSpecRows(content, slide)}</table>
		</figcaption>
	</figure>`;
};

export const renderGallery = <T extends SlideBase>(content: StoreShotsContent<T>): string => {
  const cells = content.slides.map((slide) => renderCell(content, slide)).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Store Screenshots — Preview</title>
<style>
	body { margin: 0; padding: 32px; background: #0b0f1a; color: #e8ecf5;
		font-family: -apple-system, "Hiragino Sans", sans-serif; }
	h1 { font-size: 20px; margin: 0 0 24px; }
	.grid { display: flex; flex-wrap: wrap; gap: 28px; }
	.cell { margin: 0; width: ${THUMB_WIDTH}px; }
	.frame { overflow: hidden; border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5); }
	figcaption { margin-top: 10px; }
	.cell-id { font-weight: 700; font-size: 14px; margin-bottom: 6px; }
	table { width: 100%; border-collapse: collapse; font-size: 11px; }
	th { text-align: left; color: #8a93a6; font-weight: 500; padding: 2px 8px 2px 0;
		vertical-align: top; white-space: nowrap; }
	td { padding: 2px 0; color: #cdd4e0; }
</style>
</head>
<body>
	<h1>Store Screenshots — Preview (${content.slides.length} slides)</h1>
	<div class="grid">${cells}</div>
</body>
</html>`;
};
