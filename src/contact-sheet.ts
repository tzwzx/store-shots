// A static contact sheet that lays out the generated PNGs. It only shows the real PNGs; no re-render (no server needed).

import path from "node:path";

const escapeHtml = (text: string): string =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export const renderContactSheet = (ids: string[]): string => {
  const cells = ids
    .map((id) => {
      const safe = escapeHtml(id);
      return `<figure><img src="${safe}.png" alt="${safe}" loading="lazy" /><figcaption>${safe}</figcaption></figure>`;
    })
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Store Screenshots — Contact Sheet</title>
<style>
	body { margin: 0; padding: 32px; background: #0b0f1a; color: #e8ecf5;
		font-family: -apple-system, "Hiragino Sans", sans-serif; }
	h1 { font-size: 20px; margin: 0 0 24px; }
	.grid { display: flex; flex-wrap: wrap; gap: 24px; }
	figure { margin: 0; width: 240px; }
	img { width: 240px; height: auto; display: block; border-radius: 10px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5); }
	figcaption { margin-top: 8px; font-size: 13px; font-weight: 600; }
</style>
</head>
<body>
	<h1>Store Screenshots — Contact Sheet (${ids.length} slides)</h1>
	<div class="grid">${cells}</div>
</body>
</html>`;
};

export const writeContactSheet = async (
  outputDir: string,
  ids: string[]
): Promise<void> => {
  await Bun.write(path.join(outputDir, "index.html"), renderContactSheet(ids));
};
