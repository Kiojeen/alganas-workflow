import type { BookConfig, ChapterDivision } from "../types";
import { formatChapterLabel } from "./chapter-labels";

const DEFAULT_PAGE_CAP = 720;

export function evenChapterPages(total: number, count: number): number[] {
  const chapters = Math.max(1, Math.floor(count) || 1);
  const pages = Math.max(chapters, Math.floor(total) || chapters);
  const base = Math.floor(pages / chapters);
  let extra = pages % chapters;
  return Array.from({ length: chapters }, () => {
    const pagesForChapter = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra -= 1;
    return pagesForChapter;
  });
}

export function fitChapterPages(pages: number[], total: number): number[] {
  const count = Math.max(1, pages.length);
  const budget = Math.max(count, Math.floor(total) || count);
  const next = Array.from({ length: count }, (_, index) => {
    const value = Math.floor(Number(pages[index]));
    return Number.isFinite(value) && value >= 1 ? value : 1;
  });
  let sum = next.reduce((totalPages, pageCount) => totalPages + pageCount, 0);
  for (let index = next.length - 1; index >= 0 && sum > budget; index -= 1) {
    const spare = next[index] - 1;
    if (spare <= 0) continue;
    const cut = Math.min(spare, sum - budget);
    next[index] -= cut;
    sum -= cut;
  }
  return next;
}

export function pageCap(config: BookConfig): number {
  return Math.max(1, config.maxPagesPerChapter || DEFAULT_PAGE_CAP);
}

function automaticChapterName(config: BookConfig, index: number): string {
  return formatChapterLabel(
    config.chapterLabel,
    index + 1,
    config.chapterLabelUppercase === true,
  );
}

export function chapterNameInput(config: BookConfig, index: number): string {
  const raw = config.chapterNames?.[index] ?? "";
  return raw || automaticChapterName(config, index);
}

export function chapterDisplayName(config: BookConfig, index: number): string {
  const custom = config.chapterNames?.[index]?.trim() ?? "";
  return custom || automaticChapterName(config, index);
}

export function isCustomChapterName(config: BookConfig, index: number): boolean {
  const raw = config.chapterNames?.[index] ?? "";
  return raw.length > 0 && raw !== automaticChapterName(config, index);
}

export function withChapterNames(config: BookConfig): BookConfig {
  const count = allocatedPages(config).length;
  return {
    ...config,
    chapterNames: Array.from(
      { length: count },
      (_, index) => config.chapterNames?.[index] ?? "",
    ),
  };
}

export function setChapterName(
  config: BookConfig,
  index: number,
  name: string,
): BookConfig {
  const next = withChapterNames(config);
  if (index < 0 || index >= next.chapterNames.length) return next;
  const chapterNames = next.chapterNames.slice();
  chapterNames[index] = name === automaticChapterName(config, index) ? "" : name;
  return { ...next, chapterNames };
}

export function resetChapterName(config: BookConfig, index: number): BookConfig {
  return setChapterName(config, index, "");
}

export function showsChapterTitle(config: BookConfig): boolean {
  if (config.division !== "pages") return true;
  const total = Math.max(1, Math.floor(config.numPages) || 1);
  const cap = Math.max(1, Math.floor(config.maxPagesPerChapter) || 1);
  return total !== cap;
}

export function unassignedPagesError(config: BookConfig): string | null {
  const remaining = remainingPages(config);
  if (remaining <= 0) return null;
  return `متبقي ${remaining} صفحة غير موزعة. وزّعها على الفصول قبل المتابعة.`;
}

export function allocatedPages(config: BookConfig): number[] {
  const total = Math.max(1, config.numPages || 1);
  if (config.division === "chapters") {
    const count = Math.min(Math.max(1, config.chapterCount || 1), total);
    if (!config.chapterPages || config.chapterPages.length !== count) {
      return evenChapterPages(total, count);
    }
    return fitChapterPages(config.chapterPages, total);
  }

  const cap = pageCap(config);
  const pages: number[] = [];
  let remaining = total;
  while (remaining > 0) {
    const take = Math.min(cap, remaining);
    pages.push(take);
    remaining -= take;
  }
  return pages;
}

export function remainingPages(config: BookConfig): number {
  const total = Math.max(0, config.numPages || 0);
  const used = allocatedPages(config).reduce((sum, pages) => sum + pages, 0);
  return Math.max(0, total - used);
}

function pagesModeCount(config: BookConfig): number {
  const total = Math.max(1, config.numPages || 1);
  return Math.max(1, Math.ceil(total / pageCap(config)));
}

export function setDivision(config: BookConfig, division: ChapterDivision): BookConfig {
  if (division === config.division) return config;
  if (division === "chapters") {
    const total = Math.max(1, config.numPages || 1);
    const count = Math.min(pagesModeCount(config), total);
    return withChapterNames({
      ...config,
      division,
      chapterCount: count,
      chapterPages: evenChapterPages(total, count),
    });
  }
  return withChapterNames({ ...config, division: "pages" });
}

export function setTotalPages(config: BookConfig, numPages: number): BookConfig {
  const pages = Math.max(0, Math.floor(numPages) || 0);
  if (config.division !== "chapters") {
    return withChapterNames({ ...config, numPages: pages });
  }
  const total = Math.max(1, pages || 1);
  const count = Math.min(Math.max(1, config.chapterCount || 1), total);
  return withChapterNames({
    ...config,
    numPages: pages,
    chapterCount: count,
    chapterPages: evenChapterPages(total, count),
  });
}

export function setMaxPagesPerChapter(config: BookConfig, raw: number): BookConfig {
  return withChapterNames({
    ...config,
    maxPagesPerChapter: Math.max(1, Math.floor(raw) || 1),
  });
}

export function setChapterCount(config: BookConfig, count: number): BookConfig {
  const total = Math.max(1, config.numPages || 1);
  const nextCount = Math.min(Math.max(1, Math.floor(count) || 1), total);
  return withChapterNames({
    ...config,
    division: "chapters",
    chapterCount: nextCount,
    chapterPages: evenChapterPages(total, nextCount),
  });
}

export function setChapterPageAt(
  config: BookConfig,
  index: number,
  raw: number,
): BookConfig {
  const total = Math.max(1, config.numPages || 1);
  const current = allocatedPages({ ...config, division: "chapters" });
  if (index < 0 || index >= current.length) return config;
  const others = current.reduce(
    (sum, pages, pageIndex) => (pageIndex === index ? sum : sum + pages),
    0,
  );
  const max = Math.max(1, total - others);
  const value = Math.min(max, Math.max(1, Math.floor(raw) || 1));
  const chapterPages = current.slice();
  chapterPages[index] = value;
  return {
    ...config,
    division: "chapters",
    chapterCount: chapterPages.length,
    chapterPages,
  };
}
