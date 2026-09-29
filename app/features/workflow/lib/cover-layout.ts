import type { BookConfig, CoverKind, CoverPageSize, CoverSide } from "../types";
import { allocatedPages, chapterDisplayName } from "./chapter-division";

export const A4_WIDTH_CM = 21;
export const A4_HEIGHT_CM = 29.7;
export const A5_WIDTH_CM = 14.8;
export const A5_HEIGHT_CM = 21;
export const ARTBOARD_WIDTH_CM = 47;
export const ARTBOARD_HEIGHT_CM = 29.7;
export const PAGES_PER_SPINE_CM = 167;
/** Earlier builds shipped this default; stored prefs still carrying it are migrated. */
export const LEGACY_PAGES_PER_SPINE_CM = 200;
export const MAX_PAGES_PER_VOLUME = 720;
export const DEFAULT_STRIPE_LAYOUT_A4 = {
  widthCm: 12,
  insetCm: 1.2,
  edgeGapCm: 1.2,
} as const;

export const DEFAULT_STRIPE_LAYOUT_A5 = {
  widthCm: 8.4,
  insetCm: 0.84,
  edgeGapCm: 0.84,
} as const;

export const DEFAULT_STRIPE_WIDTH_A4_CM = DEFAULT_STRIPE_LAYOUT_A4.widthCm;
export const DEFAULT_STRIPE_WIDTH_A5_CM = DEFAULT_STRIPE_LAYOUT_A5.widthCm;
export const BACK_STRIPE_WIDTH_CM = DEFAULT_STRIPE_WIDTH_A4_CM;
export const STRIPE_EDGE_GAP_CM = DEFAULT_STRIPE_LAYOUT_A4.edgeGapCm;
export const STRIPE_INSET_CM = DEFAULT_STRIPE_LAYOUT_A4.insetCm;

export type StripeLayoutCm = {
  widthCm: number;
  insetCm: number;
  edgeGapCm: number;
};

export function defaultStripeLayout(
  pageSize: CoverPageSize = "a4",
): StripeLayoutCm {
  const source =
    pageSize === "a5" ? DEFAULT_STRIPE_LAYOUT_A5 : DEFAULT_STRIPE_LAYOUT_A4;
  return { ...source };
}
export const PREVIEW_DPI = 150;
export const EXPORT_DPI = 200;
export const DEFAULT_COVER_COLOR = "#5c5044";
const GUIDE_COLOR = "#ff2e94";
export const DEFAULT_STRIPE_FOREGROUND = "#f4efe6";
export const DEFAULT_CHAPTER_LABEL_COLOR = "#ffffff";
export const DEFAULT_CHAPTER_LABEL_SIZE_CM = 0.9;
export const MIN_CHAPTER_LABEL_SIZE_CM = 0.3;
export const MAX_CHAPTER_LABEL_SIZE_CM = 4;

/** Hebrew, Arabic, Syriac, Thaana, N'Ko and the Arabic presentation forms. */
export function isRtlText(value: string) {
  return /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/.test(value);
}

export function clampChapterLabelSize(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_CHAPTER_LABEL_SIZE_CM;
  }
  return Math.min(
    MAX_CHAPTER_LABEL_SIZE_CM,
    Math.max(MIN_CHAPTER_LABEL_SIZE_CM, value),
  );
}
/** Spines thinner than this keep their width, but lose their text unless forced. */
export const MIN_SPINE_CM = 1;
export const SPINE_MARK_WIDTH_CM = 0.1;
export const SPINE_MARK_HEIGHT_CM = 0.7;
export const SPINE_TITLE_MIN_GAP_CM = 1;

export function spineNumberFromTopCm(pageSize: CoverPageSize = "a4") {
  return pageSize === "a5" ? 1.5 : 3;
}

/** Arabic ordinals read larger than digits at the same size. */
export function spineNumberFontSize(baseSize: number, text: string) {
  return /[\u0600-\u06FF]/.test(text) ? baseSize * 0.75 : baseSize;
}
export const STRIPE_TEXT_SIZE_CM = 0.42;
export const STRIPE_TEXT =
  "The afternoon light slipped across the desk and caught the edge of a half-open notebook. Outside, a dry wind moved through the trees as if turning pages of its own. Someone had left a cup of tea to cool beside a stack of letters, each one waiting for a reply that might never come. In that quiet, even the smallest mark of ink felt like a beginning.";

export type CoverChapter = {
  pages: number;
  label: string;
  index: number;
};

export type DrawCoverOptions = {
  sourceImage: HTMLImageElement | null;
  /** Back panel image for a double cover. */
  backImage?: HTMLImageElement | null;
  pages: number;
  label: string;
  bookName: string;
  coverSide: CoverSide;
  coverKind?: CoverKind;
  dpi: number;
  coverColor: string;
  stripeColor?: string;
  stripeForeground: string;
  chapterLabelColor: string;
  chapterLabelShadow?: boolean;
  chapterLabelX: number;
  chapterLabelY: number;
  chapterLabelSizeCm?: number;
  stripeText?: string;
  spineMarkColor?: string;
  spineTextColor?: string;
  /** Skip the spine and everything on it. */
  hideSpine?: boolean;
  /** Keep the spine, but omit the title and chapter number. */
  hideSpineText?: boolean;
  descriptionScale?: number;
  titleFont?: string;
  descriptionFont?: string;
  labelFont?: string;
  titleWeight?: number;
  descriptionWeight?: number;
  labelWeight?: number;
  chapterNumber?: string;
  pagesPerSpineCm?: number;
  pageSize?: CoverPageSize;
  stripeWidthCm?: number;
  stripeInsetCm?: number;
  stripeEdgeGapCm?: number;
};

export function spineWidthCm(
  pages: number,
  pagesPerCm = PAGES_PER_SPINE_CM,
): number {
  return Math.max(0, pages) / Math.max(1, pagesPerCm);
}

export function wrapWidthCm(
  pages: number,
  pagesPerCm = PAGES_PER_SPINE_CM,
  pageWidthCm = A4_WIDTH_CM,
  hideSpine = false,
): number {
  return pageWidthCm * 2 + (hideSpine ? 0 : spineWidthCm(pages, pagesPerCm));
}

/** True when the spine is too thin for text and the user has not forced it. */
export function spineHiddenFor(
  pages: number,
  pagesPerCm = PAGES_PER_SPINE_CM,
  forceSpine = false,
): boolean {
  return !forceSpine && spineWidthCm(pages, pagesPerCm) < MIN_SPINE_CM;
}

/** Lines for the chapter number on the spine: Arabic ordinals stack word under word. */
export function spineNumberLines(chapterNumber: string): string[] {
  const text = chapterNumber.trim();
  if (!text) return [];
  return isRtlText(text) ? text.split(/\s+/).filter(Boolean) : [text];
}

export function isSinglePageCover(config: { coverKind?: CoverKind }) {
  return config.coverKind === "page";
}

/** Front and back are both full cover images; there is no description stripe. */
export function isDoubleCover(config: { coverKind?: CoverKind }) {
  return config.coverKind === "double";
}

export function pageDimsCm(pageSize: CoverPageSize = "a4") {
  return pageSize === "a5"
    ? { width: A5_WIDTH_CM, height: A5_HEIGHT_CM }
    : { width: A4_WIDTH_CM, height: A4_HEIGHT_CM };
}

export function cmToPx(cm: number, dpi: number): number {
  return (cm / 2.54) * dpi;
}

export function cmToPt(cm: number): number {
  return (cm / 2.54) * 72;
}

export type CoverLayoutCm = {
  fitScale: number;
  a4W: number;
  spineW: number;
  wrapW: number;
  originX: number;
  originY: number;
  height: number;
  frontX: number;
  backX: number;
  spineX: number;
  stripeX: number;
  stripeW: number;
  frontOnLeft: boolean;
};

export function layoutCoverCm(
  pages: number,
  coverSide: CoverSide,
  pagesPerCm = PAGES_PER_SPINE_CM,
  pageSize: CoverPageSize = "a4",
  stripe?: Partial<StripeLayoutCm>,
  hideSpine = false,
): CoverLayoutCm {
  const dims = pageDimsCm(pageSize);
  const metrics = {
    ...defaultStripeLayout(pageSize),
    ...Object.fromEntries(
      Object.entries(stripe ?? {}).filter(
        ([, value]) => typeof value === "number" && Number.isFinite(value),
      ),
    ),
  } as StripeLayoutCm;
  const wrapCm = wrapWidthCm(pages, pagesPerCm, dims.width, hideSpine);
  const fitScale = wrapCm > ARTBOARD_WIDTH_CM ? ARTBOARD_WIDTH_CM / wrapCm : 1;
  const a4W = dims.width * fitScale;
  const spineW = hideSpine ? 0 : spineWidthCm(pages, pagesPerCm) * fitScale;
  const wrapW = a4W * 2 + spineW;
  const originX = (ARTBOARD_WIDTH_CM - wrapW) / 2;
  const originY = 0;
  const height = dims.height * fitScale;
  const frontOnLeft = coverSide === "rtl";
  const frontX = frontOnLeft ? originX : originX + a4W + spineW;
  const spineX = originX + a4W;
  const backX = frontOnLeft ? originX + a4W + spineW : originX;
  const edgeGap = metrics.edgeGapCm * fitScale;
  const stripeW =
    Math.min(metrics.widthCm, Math.max(0.5, dims.width - metrics.edgeGapCm)) *
    fitScale;
  const stripeX = frontOnLeft
    ? backX + a4W - stripeW - edgeGap
    : backX + edgeGap;
  return {
    fitScale,
    a4W,
    spineW,
    wrapW,
    originX,
    originY,
    height,
    frontX,
    backX,
    spineX,
    stripeX,
    stripeW,
    frontOnLeft,
  };
}

export type GuideLine =
  | { axis: "x"; cm: number; kind: "trim" | "fold" | "stripe" | "center" }
  | { axis: "y"; cm: number; kind: "trim" | "fold" | "stripe" | "center" };

/**
 * Guide positions on the artboard, in centimetres. Trim edges, spine folds,
 * the stripe box, and the centre lines of each panel.
 */
export function coverGuidesCm(layout: CoverLayoutCm): GuideLine[] {
  const top = layout.originY;
  const bottom = layout.originY + layout.height;
  const guides: GuideLine[] = [
    { axis: "x", cm: layout.originX, kind: "trim" },
    { axis: "x", cm: layout.originX + layout.wrapW, kind: "trim" },
    { axis: "y", cm: top, kind: "trim" },
    { axis: "y", cm: bottom, kind: "trim" },
    { axis: "x", cm: layout.spineX, kind: "fold" },
    { axis: "x", cm: layout.spineX + layout.spineW, kind: "fold" },
    { axis: "x", cm: layout.stripeX, kind: "stripe" },
    { axis: "x", cm: layout.stripeX + layout.stripeW, kind: "stripe" },
    { axis: "x", cm: layout.frontX + layout.a4W / 2, kind: "center" },
    { axis: "x", cm: layout.backX + layout.a4W / 2, kind: "center" },
    { axis: "y", cm: (top + bottom) / 2, kind: "center" },
  ];
  if (layout.spineW > 0.05) {
    guides.push({
      axis: "x",
      cm: layout.spineX + layout.spineW / 2,
      kind: "center",
    });
  }
  return guides;
}

/** Trim and centre lines for a cover that is just the page. */
export function singlePageGuidesCm(width: number, height: number): GuideLine[] {
  return [
    { axis: "x", cm: 0, kind: "trim" },
    { axis: "x", cm: width, kind: "trim" },
    { axis: "y", cm: 0, kind: "trim" },
    { axis: "y", cm: height, kind: "trim" },
    { axis: "x", cm: width / 2, kind: "center" },
    { axis: "y", cm: height / 2, kind: "center" },
  ];
}

export function wrapWords(
  text: string,
  maxWidth: number,
  widthOf: (value: string) => number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (widthOf(next) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function hexToRgb01(hex: string): { r: number; g: number; b: number } {
  const [r, g, b] = parseHex(hex);
  return { r: r / 255, g: g / 255, b: b / 255 };
}

export function fileSafeName(value: string, fallback = "cover") {
  const cleaned = value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 80);
  return cleaned || fallback;
}

export function downloadDataUrl(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function chapterPageCap(config: BookConfig): number {
  return Math.max(1, config.maxPagesPerChapter || MAX_PAGES_PER_VOLUME);
}

export function resolveChapters(config: BookConfig): CoverChapter[] {
  const pages = allocatedPages(config);
  return pages.map((count, index) => ({
    pages: count,
    index: index + 1,
    label: chapterDisplayName(config, index),
  }));
}

export function loadCoverImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (!url.startsWith("blob:") && !url.startsWith("data:")) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load cover image"));
    image.src = url;
  });
}

export function extractPalette(
  image: HTMLImageElement,
  maxColors = 8,
): string[] {
  const sample = document.createElement("canvas");
  const size = 64;
  sample.width = size;
  sample.height = size;
  const ctx = sample.getContext("2d");
  if (!ctx) return [DEFAULT_COVER_COLOR];

  ctx.drawImage(image, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  const buckets = new Map<
    string,
    { r: number; g: number; b: number; n: number }
  >();

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 80) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const current = buckets.get(key);
    if (current) {
      current.r += r;
      current.g += g;
      current.b += b;
      current.n += 1;
    } else {
      buckets.set(key, { r, g, b, n: 1 });
    }
  }

  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, maxColors)
    .map((bucket) => {
      const r = Math.round(bucket.r / bucket.n);
      const g = Math.round(bucket.g / bucket.n);
      const b = Math.round(bucket.b / bucket.n);
      return rgbToHex(r, g, b);
    });
}

export function drawCoverOnCanvas(
  canvas: HTMLCanvasElement,
  options: DrawCoverOptions,
) {
  const {
    sourceImage,
    pages,
    label,
    bookName,
    coverSide,
    dpi,
    coverColor,
    stripeColor,
    stripeForeground,
    chapterLabelColor,
    chapterLabelX,
    chapterLabelY,
    chapterLabelSizeCm,
    stripeText,
    spineMarkColor,
    spineTextColor,
    hideSpine = false,
    hideSpineText = false,
    descriptionScale,
    titleFont,
    descriptionFont,
    labelFont,
    titleWeight,
    descriptionWeight,
    labelWeight,
    chapterNumber,
    pagesPerSpineCm,
    pageSize,
    stripeWidthCm,
    stripeInsetCm,
    stripeEdgeGapCm,
  } = options;
  if ((options.coverKind ?? "wrap") === "page") {
    drawSinglePageCanvas(canvas, options);
    return;
  }

  const widthPx = Math.round(cmToPx(ARTBOARD_WIDTH_CM, dpi));
  const heightPx = Math.round(cmToPx(ARTBOARD_HEIGHT_CM, dpi));
  const fill = coverColor || DEFAULT_COVER_COLOR;
  const stripeFill = stripeColor?.trim() || shiftHex(fill, -18);
  const textFill = stripeForeground || DEFAULT_STRIPE_FOREGROUND;
  const labelColor = chapterLabelColor || DEFAULT_CHAPTER_LABEL_COLOR;
  const titleFamily = titleFont || "CoverMontserratTitle";
  const descriptionFamily = descriptionFont || "CoverMontserratDescription";
  const chapterFamily = labelFont || titleFamily;
  const spineWeight = titleWeight ?? 600;
  const stripeWeight = descriptionWeight ?? 400;
  const chapterWeight = labelWeight ?? 700;
  const layout = layoutCoverCm(
    pages,
    coverSide,
    pagesPerSpineCm,
    pageSize,
    {
      widthCm: stripeWidthCm,
      insetCm: stripeInsetCm,
      edgeGapCm: stripeEdgeGapCm,
    },
    hideSpine,
  );
  const p = (cm: number) => cmToPx(cm, dpi);

  canvas.width = widthPx;
  canvas.height = heightPx;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, widthPx, heightPx);

  const originY = p(layout.originY);
  const a4W = p(layout.a4W);
  const spineW = p(layout.spineW);
  const frontX = p(layout.frontX);
  const spineX = p(layout.spineX);
  const backX = p(layout.backX);
  const stripeW = p(layout.stripeW);
  const stripeX = p(layout.stripeX);
  const frontOnLeft = layout.frontOnLeft;
  const coverH = p(layout.height);

  const double = options.coverKind === "double";
  ctx.fillStyle = fill;
  ctx.fillRect(backX, originY, a4W, coverH);
  if (!hideSpine) ctx.fillRect(spineX, originY, Math.max(1, spineW), coverH);
  if (double && options.backImage && options.backImage.naturalWidth > 0) {
    drawImageCovering(ctx, options.backImage, backX, originY, a4W, coverH);
  }
  if (!double) {
    ctx.fillStyle = stripeFill;
    ctx.fillRect(stripeX, originY, stripeW, coverH);
  }

  if (!double)
    drawStripeParagraph(ctx, {
      x: stripeX,
      y: originY,
      width: stripeW,
      height: coverH,
      text: stripeText?.trim() || STRIPE_TEXT,
      color: textFill,
      dpi,
      fontFamily: descriptionFamily,
      fontWeight: stripeWeight,
      insetCm: stripeInsetCm ?? defaultStripeLayout(pageSize).insetCm,
      scale: descriptionScale,
    });

  if (!hideSpine) {
    if (!hideSpineText) {
      drawSpineTitle(ctx, {
        x: spineX,
        y: originY,
        width: spineW,
        height: coverH,
        title: bookName,
        chapterNumber,
        ink: spineTextColor?.trim() || contrastHex(fill),
        rtl: frontOnLeft,
        fontFamily: titleFamily,
        fontWeight: spineWeight,
        dpi,
        pageSize,
      });
    }

    drawSpineMarks(ctx, {
      x: spineX,
      y: originY,
      width: spineW,
      height: coverH,
      dpi,
      color: spineMarkColor?.trim() || contrastHex(fill),
    });
  }

  ctx.fillStyle = "#e7e1d4";
  ctx.fillRect(frontX, originY, a4W, coverH);

  if (sourceImage && sourceImage.naturalWidth > 0) {
    drawImageCovering(ctx, sourceImage, frontX, originY, a4W, coverH);
  }

  if (label) {
    drawCoverTitle(ctx, {
      x: frontX,
      y: originY,
      width: a4W,
      height: coverH,
      label,
      color: labelColor,
      dpi,
      xRatio: chapterLabelX,
      yRatio: chapterLabelY,
      sizeCm: chapterLabelSizeCm,
      fontFamily: chapterFamily,
      fontWeight: chapterWeight,
      shadow: options.chapterLabelShadow,
    });
  }
}

function drawSinglePageCanvas(
  canvas: HTMLCanvasElement,
  options: DrawCoverOptions,
) {
  const {
    sourceImage,
    label,
    dpi,
    coverColor,
    chapterLabelColor,
    chapterLabelX,
    chapterLabelY,
    chapterLabelSizeCm,
    labelFont,
    titleFont,
    labelWeight,
    pageSize,
  } = options;
  const dims = pageDimsCm(pageSize);
  const widthPx = Math.round(cmToPx(dims.width, dpi));
  const heightPx = Math.round(cmToPx(dims.height, dpi));
  const fill = coverColor || DEFAULT_COVER_COLOR;
  const labelColor = chapterLabelColor || DEFAULT_CHAPTER_LABEL_COLOR;
  const chapterFamily = labelFont || titleFont || "CoverMontserratTitle";
  const chapterWeight = labelWeight ?? 700;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = widthPx;
  canvas.height = heightPx;
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, widthPx, heightPx);
  if (sourceImage && sourceImage.naturalWidth > 0) {
    drawImageCovering(ctx, sourceImage, 0, 0, widthPx, heightPx);
  }
  if (label) {
    drawCoverTitle(ctx, {
      x: 0,
      y: 0,
      width: widthPx,
      height: heightPx,
      label,
      color: labelColor,
      dpi,
      xRatio: chapterLabelX,
      yRatio: chapterLabelY,
      sizeCm: chapterLabelSizeCm,
      fontFamily: chapterFamily,
      fontWeight: chapterWeight,
      shadow: options.chapterLabelShadow,
    });
  }
}

function drawImageCovering(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight,
  );
  const drawW = image.naturalWidth * scale;
  const drawH = image.naturalHeight * scale;
  const dx = x + (width - drawW) / 2;
  const dy = y + (height - drawH) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.drawImage(image, dx, dy, drawW, drawH);
  ctx.restore();
}

function drawCoverTitle(
  ctx: CanvasRenderingContext2D,
  args: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    color: string;
    dpi: number;
    xRatio: number;
    yRatio: number;
    sizeCm?: number;
    fontFamily: string;
    fontWeight: number;
    shadow?: boolean;
  },
) {
  const pad = cmToPx(1.2, args.dpi);
  const xRatio = Math.min(1, Math.max(0, (args.xRatio ?? 50) / 100));
  const yRatio = Math.min(1, Math.max(0, (args.yRatio ?? 88) / 100));
  const textX = args.x + pad + (args.width - pad * 2) * xRatio;
  const textY = args.y + pad + (args.height - pad * 2) * yRatio;

  ctx.save();
  ctx.fillStyle = args.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = isRtlText(args.label) ? "rtl" : "ltr";
  if (args.shadow !== false) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = Math.max(4, args.dpi * 0.04);
  }
  const fontSize = cmToPx(clampChapterLabelSize(args.sizeCm), args.dpi);
  ctx.font = `${args.fontWeight} ${fontSize}px "${args.fontFamily}", sans-serif`;
  ctx.fillText(args.label, textX, textY, args.width - pad * 2);
  ctx.restore();
}

function drawSpineMarks(
  ctx: CanvasRenderingContext2D,
  args: {
    x: number;
    y: number;
    width: number;
    height: number;
    dpi: number;
    color: string;
  },
) {
  const markW = Math.max(1, cmToPx(SPINE_MARK_WIDTH_CM, args.dpi));
  const markH = Math.max(1, cmToPx(SPINE_MARK_HEIGHT_CM, args.dpi));
  const x = args.x + args.width / 2 - markW / 2;
  ctx.save();
  ctx.fillStyle = args.color;
  ctx.fillRect(x, args.y, markW, markH);
  ctx.fillRect(x, args.y + args.height - markH, markW, markH);
  ctx.restore();
}

function splitSpineTitle(title: string, widthOf: (text: string) => number) {
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    const chars = Array.from(title);
    const mid = Math.max(1, Math.ceil(chars.length / 2));
    return [chars.slice(0, mid).join(""), chars.slice(mid).join("")] as const;
  }
  let bestAt = 1;
  let best = Number.POSITIVE_INFINITY;
  for (let index = 1; index < words.length; index += 1) {
    const score = Math.max(
      widthOf(words.slice(0, index).join(" ")),
      widthOf(words.slice(index).join(" ")),
    );
    if (score < best) {
      best = score;
      bestAt = index;
    }
  }
  return [
    words.slice(0, bestAt).join(" "),
    words.slice(bestAt).join(" "),
  ] as const;
}

/** One line when it fits. Otherwise two shorter lines at a smaller size. */
export function fitSpineTitle(args: {
  title: string;
  maxAlong: number;
  maxAcross: number;
  size: number;
  widthOf: (text: string, size: number) => number;
}) {
  const single = args.widthOf(args.title, args.size);
  if (single <= args.maxAlong) {
    return { lines: [args.title], size: args.size, along: single };
  }
  const [first, second] = splitSpineTitle(args.title, (text) =>
    args.widthOf(text, args.size),
  );
  const longer = Math.max(
    args.widthOf(first, args.size),
    args.widthOf(second, args.size),
  );
  const acrossGap = args.size * 0.2;
  const sizeByAcross = Math.max(1, (args.maxAcross * 0.82 - acrossGap) / 2);
  const sizeByAlong =
    longer > 0 ? args.size * (args.maxAlong / longer) : args.size;
  const size = Math.max(
    1,
    Math.min(args.size * 0.85, sizeByAcross, sizeByAlong),
  );
  const scale = size / args.size;
  return {
    lines: [first, second],
    size,
    along: longer * scale,
  };
}

function drawSpineTitle(
  ctx: CanvasRenderingContext2D,
  args: {
    x: number;
    y: number;
    width: number;
    height: number;
    title: string;
    chapterNumber?: string;
    ink: string;
    rtl: boolean;
    fontFamily: string;
    fontWeight: number;
    dpi: number;
    pageSize?: CoverPageSize;
  },
) {
  const title = args.title.trim();
  const chapterNumber = args.chapterNumber?.trim() ?? "";
  if ((!title && !chapterNumber) || args.width < 6) return;

  const ink = args.ink;
  const markH = cmToPx(SPINE_MARK_HEIGHT_CM, args.dpi);
  const edge = cmToPx(0.15, args.dpi);
  const minGap = cmToPx(SPINE_TITLE_MIN_GAP_CM, args.dpi);
  const cx = args.x + args.width / 2;
  const baseSize = Math.min(args.width * 0.55, args.height * 0.04);
  const family = `"${args.fontFamily}", sans-serif`;
  const widthOf = (text: string, size: number) => {
    ctx.font = `${args.fontWeight} ${size}px ${family}`;
    return ctx.measureText(text).width;
  };

  const numberLines = spineNumberLines(chapterNumber);
  let numberSize = spineNumberFontSize(baseSize, chapterNumber);
  const numberFromTop = chapterNumber
    ? cmToPx(spineNumberFromTopCm(args.pageSize), args.dpi)
    : 0;
  const zoneBottom = args.height - markH - edge;
  if (numberLines.length > 0) {
    const maxNumberWidth = args.width * 0.92;
    const widest = Math.max(
      ...numberLines.map((line) => widthOf(line, numberSize)),
    );
    if (widest > maxNumberWidth && widest > 0) {
      numberSize *= maxNumberWidth / widest;
    }
  }
  const numberLineHeight = numberSize * 1.1;
  const numberAlong =
    numberLines.length > 0 ? numberLineHeight * numberLines.length : 0;

  const zoneTop = chapterNumber
    ? numberFromTop + numberAlong + minGap
    : markH + edge;
  const maxAlong = Math.max(1, zoneBottom - zoneTop);
  const fitted = title
    ? fitSpineTitle({
        title,
        maxAlong,
        maxAcross: args.width,
        size: baseSize,
        widthOf,
      })
    : null;

  const drawRotated = (
    lines: string[],
    size: number,
    centerFromTop: number,
  ) => {
    ctx.save();
    ctx.translate(cx, args.y + centerFromTop);
    ctx.rotate(args.rtl ? -Math.PI / 2 : Math.PI / 2);
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${args.fontWeight} ${size}px ${family}`;
    if (lines.length === 1) {
      ctx.fillText(lines[0], 0, 0);
    } else {
      const lineGap = size * 0.2;
      const offset = (size + lineGap) / 2;
      ctx.fillText(lines[0], 0, -offset);
      ctx.fillText(lines[1], 0, offset);
    }
    ctx.restore();
  };

  if (numberLines.length > 0) {
    ctx.save();
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.direction = isRtlText(chapterNumber) ? "rtl" : "ltr";
    ctx.font = `${args.fontWeight} ${numberSize}px ${family}`;
    for (const [index, line] of numberLines.entries()) {
      ctx.fillText(
        line,
        cx,
        args.y + numberFromTop + index * numberLineHeight,
        args.width * 0.92,
      );
    }
    ctx.restore();
  }
  if (!fitted) return;

  const ideal = args.height / 2;
  const minCenter = zoneTop + fitted.along / 2;
  const maxCenter = zoneBottom - fitted.along / 2;
  const center =
    minCenter <= maxCenter
      ? Math.min(Math.max(ideal, minCenter), maxCenter)
      : (zoneTop + zoneBottom) / 2;
  drawRotated(fitted.lines, fitted.size, center);
}

function drawStripeParagraph(
  ctx: CanvasRenderingContext2D,
  args: {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    color: string;
    dpi: number;
    fontFamily: string;
    fontWeight: number;
    insetCm?: number;
    scale?: number;
  },
) {
  if (!args.text) return;

  const inset = args.insetCm ?? STRIPE_INSET_CM;
  const padX = cmToPx(inset, args.dpi);
  const padY = cmToPx(inset, args.dpi);
  const maxWidth = args.width - padX * 2;
  const fontSize = cmToPx(STRIPE_TEXT_SIZE_CM * (args.scale ?? 1), args.dpi);
  const lineHeight = fontSize * 1.45;

  ctx.save();
  ctx.beginPath();
  ctx.rect(args.x, args.y, args.width, args.height);
  ctx.clip();
  ctx.fillStyle = args.color;
  ctx.textBaseline = "middle";
  const rtl = isRtlText(args.text);
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.font = `${args.fontWeight} ${fontSize}px "${args.fontFamily}", serif`;

  const lines = wrapWords(
    args.text,
    maxWidth,
    (value) => ctx.measureText(value).width,
  );
  const startY =
    args.y + args.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  const left = args.x + padX;
  const centerX = args.x + args.width / 2;
  for (const [index, line] of lines.entries()) {
    const y = startY + index * lineHeight;
    if (y < args.y + padY || y > args.y + args.height - padY) continue;
    const isLast = index === lines.length - 1;
    drawJustifiedLine(ctx, line, centerX, left, y, maxWidth, isLast, rtl);
  }
  ctx.restore();
}

/**
 * Full-justified line. Right-to-left text starts at the right edge and each
 * word steps leftwards; the short last line is centred with the paragraph's
 * own direction so trailing punctuation lands at the end of the sentence.
 */
function drawJustifiedLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  centerX: number,
  left: number,
  y: number,
  maxWidth: number,
  isLast: boolean,
  rtl: boolean,
) {
  const words = line.split(/\s+/).filter(Boolean);
  if (isLast || words.length < 2) {
    ctx.textAlign = "center";
    ctx.fillText(line, centerX, y, maxWidth);
    return;
  }

  const total = words.reduce(
    (sum, word) => sum + ctx.measureText(word).width,
    0,
  );
  const gap = (maxWidth - total) / (words.length - 1);
  if (rtl) {
    let x = left + maxWidth;
    ctx.textAlign = "right";
    for (const word of words) {
      ctx.fillText(word, x, y);
      x -= ctx.measureText(word).width + gap;
    }
    return;
  }
  let x = left;
  ctx.textAlign = "left";
  for (const word of words) {
    ctx.fillText(word, x, y);
    x += ctx.measureText(word).width + gap;
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

function parseHex(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value.padEnd(6, "0").slice(0, 6);
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

export function shiftHex(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  const clamp = (n: number) => Math.max(0, Math.min(255, n + amount));
  return rgbToHex(clamp(r), clamp(g), clamp(b));
}

const INK_DARK = "#1c1814";
const INK_LIGHT = "#f7f3ea";

function channelLuminance(value: number) {
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string) {
  const [r, g, b] = parseHex(hex);
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

export function contrastRatio(foreground: string, background: string) {
  const lighter = Math.max(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );
  const darker = Math.min(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );
  return (lighter + 0.05) / (darker + 0.05);
}

export function contrastHex(hex: string): string {
  return contrastRatio(hex, INK_LIGHT) > contrastRatio(hex, INK_DARK)
    ? INK_LIGHT
    : INK_DARK;
}

/** Keep a chosen ink when it already stands out; otherwise pick the clearer one. */
export function readableOn(foreground: string, background: string) {
  const ink = foreground.trim();
  if (!ink || contrastRatio(ink, background) < 3)
    return contrastHex(background);
  return ink;
}

export function sampleChapterBackdrop(
  image: HTMLImageElement | null,
  panelWidthCm: number,
  panelHeightCm: number,
  xPercent: number,
  yPercent: number,
): string {
  const fallback = "#e7e1d4";
  if (!image || image.naturalWidth < 1 || image.naturalHeight < 1) {
    return fallback;
  }
  const xRatio = Math.min(1, Math.max(0, xPercent / 100));
  const yRatio = Math.min(1, Math.max(0, yPercent / 100));
  const pad = 1.2;
  const panelX = (pad + (panelWidthCm - pad * 2) * xRatio) / panelWidthCm;
  const panelY = (pad + (panelHeightCm - pad * 2) * yRatio) / panelHeightCm;
  const iw = image.naturalWidth;
  const ih = image.naturalHeight;
  const scale = Math.max(panelWidthCm / iw, panelHeightCm / ih);
  const dx = (panelWidthCm - iw * scale) / 2;
  const dy = (panelHeightCm - ih * scale) / 2;
  const sx = Math.min(
    iw - 1,
    Math.max(0, (panelX * panelWidthCm - dx) / scale),
  );
  const sy = Math.min(
    ih - 1,
    Math.max(0, (panelY * panelHeightCm - dy) / scale),
  );
  const radius = Math.max(4, Math.round(Math.min(iw, ih) * 0.03));
  const canvas = document.createElement("canvas");
  const sample = 12;
  canvas.width = sample;
  canvas.height = sample;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return fallback;
  ctx.drawImage(
    image,
    sx - radius,
    sy - radius,
    radius * 2,
    radius * 2,
    0,
    0,
    sample,
    sample,
  );
  const data = ctx.getImageData(0, 0, sample, sample).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 80) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n += 1;
  }
  if (!n) return fallback;
  return rgbToHex(Math.round(r / n), Math.round(g / n), Math.round(b / n));
}
