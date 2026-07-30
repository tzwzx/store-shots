// Small HTML helpers for templates. Optional: import from "@tzwzx/store-shots/html".
// Kept out of the package root so the engine <-> content contract stays minimal.

/** Escape text for safe interpolation into HTML (both element and attribute positions). */
export const escapeHtml = (text: string): string =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/**
 * Escape a line and wrap every occurrence of `accent` in `<span class="accent">`.
 * Splitting before escaping keeps the match exact even when the copy contains
 * characters that escape to multi-character entities.
 */
export const accentHtml = (line: string, accent: string): string => {
  if (accent === "" || !line.includes(accent)) {
    return escapeHtml(line);
  }
  const wrapped = `<span class="accent">${escapeHtml(accent)}</span>`;
  return line.split(accent).map(escapeHtml).join(wrapped);
};
