import type { BookConfig, CoverSide } from "../types";

export const A4_WIDTH_CM = 21;
export const A4_HEIGHT_CM = 29.7;
export const ARTBOARD_WIDTH_CM = 47;
export const ARTBOARD_HEIGHT_CM = 29.7;
export const PAGES_PER_SPINE_CM = 200;
export const MAX_PAGES_PER_VOLUME = 720;
export const PREVIEW_DPI = 150;
export const EXPORT_DPI = 200;

export type CoverChapter = {
  pages: number;
  label: string;
};

export type DrawCoverOptions = {
  sourceImage: HTMLImageElement | null;
  pages: number;
  label: string;
  coverSide: CoverSide;
  showGuides: boolean;
  dpi: number;
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

export function resolveChapters(config: BookConfig): CoverChapter[] {
  const totalPages = Math.max(1, config.numPages || 1);
  const baseLabel = config.chapterLabel.trim() || "الفصل";

  if (!config.autoChapter) {
    return [{ pages: totalPages, label: baseLabel }];
  }

  const count = Math.max(1, Math.ceil(totalPages / MAX_PAGES_PER_VOLUME));
  const chapters: CoverChapter[] = [];
  let remaining = totalPages;

  for (let i = 1; i <= count; i++) {
    const pages = Math.min(MAX_PAGES_PER_VOLUME, remaining);
    remaining -= pages;
    chapters.push({
      pages,
      label: `${baseLabel} ${i}`,
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

export function drawCoverOnCanvas(
  canvas: HTMLCanvasElement,
  options: DrawCoverOptions,
) {
  const { sourceImage, pages, label, coverSide, showGuides, dpi } = options;
  const widthPx = Math.round(cmToPx(ARTBOARD_WIDTH_CM, dpi));
  const heightPx = Math.round(cmToPx(ARTBOARD_HEIGHT_CM, dpi));

  canvas.width = widthPx;
  canvas.height = heightPx;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#f3efe6";
  ctx.fillRect(0, 0, widthPx, heightPx);

  const wrapCm = wrapWidthCm(pages);
  const fitScale = wrapCm > ARTBOARD_WIDTH_CM ? ARTBOARD_WIDTH_CM / wrapCm : 1;
  const a4W = cmToPx(A4_WIDTH_CM * fitScale, dpi);
  const spineW = cmToPx(spineWidthCm(pages) * fitScale, dpi);
  const wrapW = a4W * 2 + spineW;
  const originX = (widthPx - wrapW) / 2;
  const originY = 0;

  const frontOnLeft = coverSide === "rtl";
  const frontX = frontOnLeft ? originX : originX + a4W + spineW;
  const spineX = frontOnLeft ? originX + a4W : originX + a4W;
  const backX = frontOnLeft ? originX + a4W + spineW : originX;

  ctx.fillStyle = "#d8d0c2";
  ctx.fillRect(backX, originY, a4W, heightPx);

  const spineFill = sampleSpineColor(sourceImage, frontOnLeft);
  ctx.fillStyle = spineFill;
  ctx.fillRect(spineX, originY, Math.max(1, spineW), heightPx);

  ctx.fillStyle = "#e7e1d4";
  ctx.fillRect(frontX, originY, a4W, heightPx);

  if (sourceImage && sourceImage.naturalWidth > 0) {
    drawImageCovering(ctx, sourceImage, frontX, originY, a4W, heightPx);

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.filter = "blur(12px)";
    drawImageCovering(ctx, sourceImage, backX, originY, a4W, heightPx);
    ctx.restore();
    ctx.fillStyle = "rgba(20, 16, 12, 0.28)";
    ctx.fillRect(backX, originY, a4W, heightPx);
  }

  drawSpineLabel(ctx, {
    x: spineX,
    width: spineW,
    height: heightPx,
    label,
    fill: spineFill,
    rtl: frontOnLeft,
  });

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
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
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

function sampleSpineColor(
  image: HTMLImageElement | null,
  fromLeftEdge: boolean,
): string {
  if (!image) return "#5c5044";

  const sample = document.createElement("canvas");
  sample.width = 8;
  sample.height = 8;
  const ctx = sample.getContext("2d");
  if (!ctx) return "#5c5044";

  const sx = fromLeftEdge ? 0 : Math.max(0, image.naturalWidth - 8);
  ctx.drawImage(image, sx, 0, 8, image.naturalHeight, 0, 0, 8, 8);
  const data = ctx.getImageData(0, 0, 8, 8).data;
  let r = 0;
  let g = 0;
  let b = 0;
  const count = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  return `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`;
}

function luminance(fill: string): number {
  const match = fill.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return 0.3;
  const r = Number(match[1]) / 255;
  const g = Number(match[2]) / 255;
  const b = Number(match[3]) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function drawSpineLabel(
  ctx: CanvasRenderingContext2D,
  args: {
    x: number;
    width: number;
    height: number;
    label: string;
    fill: string;
    rtl: boolean;
  },
) {
  if (args.width < 8 || !args.label) return;

  ctx.save();
  ctx.translate(args.x + args.width / 2, args.height / 2);
  ctx.rotate(args.rtl ? Math.PI / 2 : -Math.PI / 2);
  ctx.fillStyle = luminance(args.fill) > 0.55 ? "#1c1814" : "#f7f3ea";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontSize = Math.min(args.width * 0.55, args.height * 0.045);
  ctx.font = `600 ${Math.max(10, fontSize)}px "Segoe UI", "Noto Naskh Arabic", sans-serif`;
  ctx.fillText(args.label, 0, 0, args.height * 0.86);
  ctx.restore();
}
