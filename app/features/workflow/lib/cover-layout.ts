import type { BookConfig, CoverKind, CoverPageSize, CoverSide } from "../types";
import { allocatedPages, chapterDisplayName } from "./chapter-division";

export const A4_WIDTH_CM = 21;
export const A4_HEIGHT_CM = 29.7;
export const A5_WIDTH_CM = 14.8;
export const A5_HEIGHT_CM = 21;
export const ARTBOARD_WIDTH_CM = 47;
export const ARTBOARD_HEIGHT_CM = 29.7;
export const PAGES_PER_SPINE_CM = 200;
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

export function defaultStripeLayout(pageSize: CoverPageSize = "a4"): StripeLayoutCm {
  const source =
    pageSize === "a5" ? DEFAULT_STRIPE_LAYOUT_A5 : DEFAULT_STRIPE_LAYOUT_A4;
  return { ...source };
}
export const PREVIEW_DPI = 150;
export const EXPORT_DPI = 200;
export const DEFAULT_COVER_COLOR = "#5c5044";
export const DEFAULT_STRIPE_FOREGROUND = "#f4efe6";
export const DEFAULT_CHAPTER_LABEL_COLOR = "#ffffff";
export const SPINE_MARK_WIDTH_CM = 0.1;
export const SPINE_MARK_HEIGHT_CM = 0.2;
export const STRIPE_TEXT =
  "The afternoon light slipped across the desk and caught the edge of a half-open notebook. Outside, a dry wind moved through the trees as if turning pages of its own. Someone had left a cup of tea to cool beside a stack of letters, each one waiting for a reply that might never come. In that quiet, even the smallest mark of ink felt like a beginning.";

export type CoverChapter = {
  pages: number;
  label: string;
  index: number;
};

export type DrawCoverOptions = {
  sourceImage: HTMLImageElement | null;
  pages: number;
  label: string;
  bookName: string;
  coverSide: CoverSide;
  coverKind?: CoverKind;
  showGuides: boolean;
  dpi: number;
  coverColor: string;
  stripeColor?: string;
  stripeForeground: string;
  chapterLabelColor: string;
  chapterLabelX: number;
  chapterLabelY: number;
  stripeText?: string;
  spineMarkColor?: string;
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
): number {
  return pageWidthCm * 2 + spineWidthCm(pages, pagesPerCm);
}

export function isSinglePageCover(config: { coverKind?: CoverKind }) {
  return config.coverKind === "page";
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
  const wrapCm = wrapWidthCm(pages, pagesPerCm, dims.width);
  const fitScale = wrapCm > ARTBOARD_WIDTH_CM ? ARTBOARD_WIDTH_CM / wrapCm : 1;
  const a4W = dims.width * fitScale;
  const spineW = spineWidthCm(pages, pagesPerCm) * fitScale;
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
    Math.min(
      metrics.widthCm,
      Math.max(0.5, dims.width - metrics.edgeGapCm),
    ) * fitScale;
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
  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();

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
    showGuides,
    dpi,
    coverColor,
    stripeColor,
    stripeForeground,
    chapterLabelColor,
    chapterLabelX,
    chapterLabelY,
    stripeText,
    spineMarkColor,
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
  const layout = layoutCoverCm(pages, coverSide, pagesPerSpineCm, pageSize, {
    widthCm: stripeWidthCm,
    insetCm: stripeInsetCm,
    edgeGapCm: stripeEdgeGapCm,
  });
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
  const wrapW = p(layout.wrapW);
  const originX = p(layout.originX);
  const frontX = p(layout.frontX);
  const spineX = p(layout.spineX);
  const backX = p(layout.backX);
  const stripeW = p(layout.stripeW);
  const stripeX = p(layout.stripeX);
  const frontOnLeft = layout.frontOnLeft;
  const coverH = p(layout.height);

  ctx.fillStyle = fill;
  ctx.fillRect(backX, originY, a4W, coverH);
  ctx.fillRect(spineX, originY, Math.max(1, spineW), coverH);
  ctx.fillStyle = stripeFill;
  ctx.fillRect(stripeX, originY, stripeW, coverH);

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
  });

  drawSpineTitle(ctx, {
    x: spineX,
    y: originY,
    width: spineW,
    height: coverH,
    title: bookName,
    chapterNumber,
    fill,
    rtl: frontOnLeft,
    fontFamily: titleFamily,
    fontWeight: spineWeight,
    dpi,
  });

  drawSpineMarks(ctx, {
    x: spineX,
    y: originY,
    width: spineW,
    height: coverH,
    dpi,
    color: spineMarkColor?.trim() || contrastHex(fill),
  });

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
      fontFamily: chapterFamily,
      fontWeight: chapterWeight,
    });
  }

  if (showGuides) {
    ctx.save();
    ctx.strokeStyle = "rgba(70, 62, 48, 0.55)";
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = Math.max(1, dpi * 0.012);
    for (const x of [originX, spineX, spineX + spineW, originX + wrapW]) {
      ctx.beginPath();
      ctx.moveTo(x, originY);
      ctx.lineTo(x, originY + coverH);
      ctx.stroke();
    }
    ctx.restore();
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
      fontFamily: chapterFamily,
      fontWeight: chapterWeight,
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
    fontFamily: string;
    fontWeight: number;
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
  ctx.direction = "ltr";
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = Math.max(4, args.dpi * 0.04);
  const fontSize = Math.min(cmToPx(0.9, args.dpi), args.width * 0.08);
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

function drawSpineTitle(
  ctx: CanvasRenderingContext2D,
  args: {
    x: number;
    y: number;
    width: number;
    height: number;
    title: string;
    chapterNumber?: string;
    fill: string;
    rtl: boolean;
    fontFamily: string;
    fontWeight: number;
    dpi: number;
  },
) {
  const title = args.title.trim();
  const chapterNumber = args.chapterNumber?.trim() ?? "";
  if ((!title && !chapterNumber) || args.width < 6) return;

  const ink = contrastHex(args.fill);
  const markH = cmToPx(SPINE_MARK_HEIGHT_CM, args.dpi);
  const gap = cmToPx(0.1, args.dpi);
  const cx = args.x + args.width / 2;
  const fontSize = Math.min(args.width * 0.55, args.height * 0.04);
  const numSize = fontSize;
  const maxTitle = args.height * 0.86;

  ctx.save();
  ctx.font = `${args.fontWeight} ${Math.max(9, fontSize)}px "${args.fontFamily}", sans-serif`;
  const titleLen = title
    ? Math.min(ctx.measureText(title).width, maxTitle)
    : 0;
  ctx.restore();

  const numBlock = chapterNumber ? Math.max(9, numSize) + gap : 0;
  const block = numBlock + titleLen;
  const minTop = args.y + markH + gap;
  const maxTop = args.y + args.height - markH - gap - block;
  const top = Math.min(Math.max(args.y + args.height / 2 - block / 2, minTop), maxTop);

  if (chapterNumber) {
    ctx.save();
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = `${args.fontWeight} ${Math.max(9, numSize)}px "${args.fontFamily}", sans-serif`;
    ctx.fillText(chapterNumber, cx, top, args.width * 0.92);
    ctx.restore();
  }

  if (!title) return;

  ctx.save();
  ctx.translate(cx, top + numBlock + titleLen / 2);
  ctx.rotate(args.rtl ? -Math.PI / 2 : Math.PI / 2);
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${args.fontWeight} ${Math.max(9, fontSize)}px "${args.fontFamily}", sans-serif`;
  ctx.fillText(title, 0, 0, maxTitle);
  ctx.restore();
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
  },
) {
  if (!args.text) return;

  const inset = args.insetCm ?? STRIPE_INSET_CM;
  const padX = cmToPx(inset, args.dpi);
  const padY = cmToPx(inset, args.dpi);
  const maxWidth = args.width - padX * 2;
  const fontSize = cmToPx(0.42, args.dpi);
  const lineHeight = fontSize * 1.45;

  ctx.save();
  ctx.beginPath();
  ctx.rect(args.x, args.y, args.width, args.height);
  ctx.clip();
  ctx.fillStyle = args.color;
  ctx.textBaseline = "middle";
  ctx.direction = "ltr";
  ctx.font = `${args.fontWeight} ${fontSize}px "${args.fontFamily}", serif`;

  const lines = wrapWords(args.text, maxWidth, (value) => ctx.measureText(value).width);
  const startY =
    args.y + args.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  const left = args.x + padX;
  const centerX = args.x + args.width / 2;
  for (const [index, line] of lines.entries()) {
    const y = startY + index * lineHeight;
    if (y < args.y + padY || y > args.y + args.height - padY) continue;
    const isLast = index === lines.length - 1;
    drawJustifiedLine(ctx, line, centerX, left, y, maxWidth, isLast);
  }
  ctx.restore();
}

function drawJustifiedLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  centerX: number,
  left: number,
  y: number,
  maxWidth: number,
  isLast: boolean,
) {
  const words = line.split(/\s+/).filter(Boolean);
  if (isLast || words.length < 2) {
    ctx.textAlign = "center";
    ctx.fillText(line, centerX, y, maxWidth);
    return;
  }

  const total = words.reduce((sum, word) => sum + ctx.measureText(word).width, 0);
  const gap = (maxWidth - total) / (words.length - 1);
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
  if (!ink || contrastRatio(ink, background) < 3) return contrastHex(background);
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
  const panelX =
    (pad + (panelWidthCm - pad * 2) * xRatio) / panelWidthCm;
  const panelY =
    (pad + (panelHeightCm - pad * 2) * yRatio) / panelHeightCm;
  const iw = image.naturalWidth;
  const ih = image.naturalHeight;
  const scale = Math.max(panelWidthCm / iw, panelHeightCm / ih);
  const dx = (panelWidthCm - iw * scale) / 2;
  const dy = (panelHeightCm - ih * scale) / 2;
  const sx = Math.min(iw - 1, Math.max(0, (panelX * panelWidthCm - dx) / scale));
  const sy = Math.min(ih - 1, Math.max(0, (panelY * panelHeightCm - dy) / scale));
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
