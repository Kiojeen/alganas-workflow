/** Paths for a GitHub Pages project site. Local builds stay at `/`. */
export function pagesPaths() {
  const raw = process.env.PAGES_BASE?.trim() || "/";
  if (raw === "/") return { viteBase: "/", basename: "/" };
  const viteBase = raw.endsWith("/") ? raw : `${raw}/`;
  return { viteBase, basename: viteBase.slice(0, -1) };
}
