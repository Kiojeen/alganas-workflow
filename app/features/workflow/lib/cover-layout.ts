import type { BookConfig, CoverSide } from "../types";

export const A4_WIDTH_CM = 21;
export const A4_HEIGHT_CM = 29.7;
export const ARTBOARD_WIDTH_CM = 47;
export const ARTBOARD_HEIGHT_CM = 29.7;
export const PAGES_PER_SPINE_CM = 200;
export const MAX_PAGES_PER_VOLUME = 720;
export const BACK_STRIPE_WIDTH_CM = 15;
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
  showGuides: boolean;
  dpi: number;
  coverColor: string;
  stripeForeground: string;
  chapterLabelColor: string;
  chapterLabelX: number;
  chapterLabelY: number;
  stripeText?: string;
  spineMarkColor?: string;
};

export function spineWidthCm(pages: number): number {
  return Math.max(0, pages) / PAGES_PER_SPINE_CM;
}

export function wrapWidthCm(pages: number): number {
  return A4_WIDTH_CM * 2 + spineWidthCm(pages);
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
): CoverLayoutCm {
  const wrapCm = wrapWidthCm(pages);
  const fitScale = wrapCm > ARTBOARD_WIDTH_CM ? ARTBOARD_WIDTH_CM / wrapCm : 1;
  const a4W = A4_WIDTH_CM * fitScale;
  const spineW = spineWidthCm(pages) * fitScale;
  const wrapW = a4W * 2 + spineW;
  const originX = (ARTBOARD_WIDTH_CM - wrapW) / 2;
  const originY = 0;
  const height = ARTBOARD_HEIGHT_CM;
  const frontOnLeft = coverSide === "rtl";
  const frontX = frontOnLeft ? originX : originX + a4W + spineW;
  const spineX = originX + a4W;
  const backX = frontOnLeft ? originX + a4W + spineW : originX;
  const stripeW = Math.min(BACK_STRIPE_WIDTH_CM, A4_WIDTH_CM) * fitScale;
  const stripeX = frontOnLeft ? backX + a4W - stripeW : backX;
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

export function chapterPageCap(config: BookConfig): number {
  return Math.max(1, config.maxPagesPerChapter || MAX_PAGES_PER_VOLUME);
}

export function resolveChapters(config: BookConfig): CoverChapter[] {
  const totalPages = Math.max(1, config.numPages || 1);
  const baseLabel = config.chapterLabel.trim() || "الفصل";
  const cap = chapterPageCap(config);
  const count = config.multiChapter
    ? Math.max(1, Math.ceil(totalPages / cap))
    : 1;
  const numbered = count > 1;
  const chapters: CoverChapter[] = [];
  let remaining = totalPages;

  for (let i = 1; i <= count; i++) {
    const pages = i === count ? remaining : Math.min(cap, remaining);
    remaining -= pages;
    chapters.push({
      pages,
      label: numbered ? `${baseLabel} ${i}` : "",
      index: i,
    });
  }

  return chapters;
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
    stripeForeground,
    chapterLabelColor,
    chapterLabelX,
    chapterLabelY,
    stripeText,
    spineMarkColor,
  } = options;
  const widthPx = Math.round(cmToPx(ARTBOARD_WIDTH_CM, dpi));
  const heightPx = Math.round(cmToPx(ARTBOARD_HEIGHT_CM, dpi));
  const fill = coverColor || DEFAULT_COVER_COLOR;
  const textFill = stripeForeground || DEFAULT_STRIPE_FOREGROUND;
  const labelColor = chapterLabelColor || DEFAULT_CHAPTER_LABEL_COLOR;
  const layout = layoutCoverCm(pages, coverSide);
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

  ctx.fillStyle = fill;
  ctx.fillRect(backX, originY, a4W, heightPx);
  ctx.fillRect(spineX, originY, Math.max(1, spineW), heightPx);
  ctx.fillStyle = shiftHex(fill, -18);
  ctx.fillRect(stripeX, originY, stripeW, heightPx);

  drawStripeParagraph(ctx, {
    x: stripeX,
    y: originY,
    width: stripeW,
    height: heightPx,
    text: stripeText?.trim() || STRIPE_TEXT,
    color: textFill,
    dpi,
  });

  drawSpineTitle(ctx, {
    x: spineX,
    width: spineW,
    height: heightPx,
    title: bookName,
    fill,
    rtl: frontOnLeft,
  });

  drawSpineMarks(ctx, {
    x: spineX,
    y: originY,
    width: spineW,
    height: heightPx,
    dpi,
    color: spineMarkColor?.trim() || contrastHex(fill),
  });

  ctx.fillStyle = "#e7e1d4";
  ctx.fillRect(frontX, originY, a4W, heightPx);

  if (sourceImage && sourceImage.naturalWidth > 0) {
    drawImageCovering(ctx, sourceImage, frontX, originY, a4W, heightPx);
  }

  if (label) {
    drawCoverTitle(ctx, {
      x: frontX,
      y: originY,
      width: a4W,
      height: heightPx,
      label,
      color: labelColor,
      dpi,
      xRatio: chapterLabelX,
      yRatio: chapterLabelY,
    });
  }

  if (showGuides) {
    ctx.save();
    ctx.strokeStyle = "rgba(70, 62, 48, 0.55)";
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = Math.max(1, dpi * 0.012);
    for (const x of [originX, spineX, spineX + spineW, originX + wrapW]) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, heightPx);
      ctx.stroke();
    }
    ctx.restore();
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
  ctx.font = `700 ${fontSize}px "Segoe UI", "Noto Naskh Arabic", sans-serif`;
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
    width: number;
    height: number;
    title: string;
    fill: string;
    rtl: boolean;
  },
) {
  const title = args.title.trim();
  if (!title || args.width < 6) return;

  ctx.save();
  ctx.translate(args.x + args.width / 2, args.height / 2);
  ctx.rotate(args.rtl ? Math.PI / 2 : -Math.PI / 2);
  ctx.fillStyle = hexLuminance(args.fill) > 0.55 ? "#1c1814" : "#f7f3ea";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontSize = Math.min(args.width * 0.55, args.height * 0.04);
  ctx.font = `600 ${Math.max(9, fontSize)}px "Segoe UI", "Noto Naskh Arabic", sans-serif`;
  ctx.fillText(title, 0, 0, args.height * 0.86);
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
  },
) {
  if (!args.text) return;

  const pad = cmToPx(0.9, args.dpi);
  const maxWidth = args.width - pad * 2;
  const fontSize = cmToPx(0.42, args.dpi);
  const lineHeight = fontSize * 1.45;

  ctx.save();
  ctx.beginPath();
  ctx.rect(args.x, args.y, args.width, args.height);
  ctx.clip();
  ctx.fillStyle = args.color;
  ctx.textBaseline = "middle";
  ctx.direction = "ltr";
  ctx.font = `400 ${fontSize}px Georgia, "Times New Roman", serif`;

  const lines = wrapWords(args.text, maxWidth, (value) => ctx.measureText(value).width);
  const startY =
    args.y + args.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  const left = args.x + pad;
  const centerX = args.x + args.width / 2;
  for (const [index, line] of lines.entries()) {
    const y = startY + index * lineHeight;
    if (y < args.y + pad || y > args.y + args.height - pad) continue;
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

function hexLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((value) => value / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastHex(hex: string): string {
  return hexLuminance(hex) > 0.55 ? "#1c1814" : "#f7f3ea";
}
