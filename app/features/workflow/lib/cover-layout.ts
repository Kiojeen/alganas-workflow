import type {
  BookConfig,
  CoverBinding,
  CoverKind,
  CoverPageSize,
  CoverSide,
  PageOrientation,
  SpineGapFill,
} from "../types";
import { allocatedPages, chapterDisplayName } from "./chapter-division";

export const A4_WIDTH_CM = 21;
export const A4_HEIGHT_CM = 29.7;
export const A5_WIDTH_CM = 14.8;
export const A5_HEIGHT_CM = 21;
export const B5_WIDTH_CM = 17;
export const B5_HEIGHT_CM = 25;
export const ARTBOARD_WIDTH_CM = 47;
export const ARTBOARD_HEIGHT_CM = 29.7;
export const HARDCOVER_ARTBOARD_WIDTH_CM = 48.7;
export const HARDCOVER_ARTBOARD_HEIGHT_CM = 30;
/** Space between a hardcover image and the spine, unless the image starts on the spine. */
export const HARDCOVER_SPINE_GAP_CM = 1;
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
  if (pageSize === "a5") return { ...DEFAULT_STRIPE_LAYOUT_A5 };
  if (pageSize === "b5") {
    const scale = B5_WIDTH_CM / A4_WIDTH_CM;
    return {
      widthCm: DEFAULT_STRIPE_LAYOUT_A4.widthCm * scale,
      insetCm: DEFAULT_STRIPE_LAYOUT_A4.insetCm * scale,
      edgeGapCm: DEFAULT_STRIPE_LAYOUT_A4.edgeGapCm * scale,
    };
  }
  return { ...DEFAULT_STRIPE_LAYOUT_A4 };
}

/** Saved stripe for this page size. B5 follows the A4 stripe, scaled to its width. */
export function stripeForPage(
  pageSize: CoverPageSize,
  stripeA4: StripeLayoutCm,
  stripeA5: StripeLayoutCm,
): StripeLayoutCm {
  if (pageSize === "a5") return stripeA5;
  if (pageSize === "b5") {
    const scale = B5_WIDTH_CM / A4_WIDTH_CM;
    return {
      widthCm: stripeA4.widthCm * scale,
      insetCm: stripeA4.insetCm * scale,
      edgeGapCm: stripeA4.edgeGapCm * scale,
    };
  }
  return stripeA4;
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
export const DEFAULT_FRONT_TITLE_SIZE_CM = 1.2;
export const MIN_FRONT_TITLE_SIZE_CM = 0.4;
export const MAX_FRONT_TITLE_SIZE_CM = 6;

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

export function clampFrontTitleSize(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_FRONT_TITLE_SIZE_CM;
  }
  return Math.min(
    MAX_FRONT_TITLE_SIZE_CM,
    Math.max(MIN_FRONT_TITLE_SIZE_CM, value),
  );
}
/** Spines thinner than this keep their width, but lose their text unless forced. */
export const MIN_SPINE_CM = 1;
export const SPINE_MARK_WIDTH_CM = 0.1;
export const SPINE_MARK_HEIGHT_CM = 0.7;
export const SPINE_TITLE_MIN_GAP_CM = 1;

export function spineNumberFromTopCm(pageSize: CoverPageSize = "a4") {
  return pageSize === "a4" ? 3 : 1.5;
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
  binding?: CoverBinding;
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
  pageOrientation?: PageOrientation;
  stripeWidthCm?: number;
  stripeInsetCm?: number;
  stripeEdgeGapCm?: number;
  frontTitleX?: number;
  frontTitleY?: number;
  frontTitleSizeCm?: number;
  frontTitleAlign?: "left" | "center" | "right";
  frontTitleLeading?: number;
  frontTitleColor?: string;
  frontTitleShadow?: boolean;
  imageFromSpine?: boolean;
  /** Hardcover image pan, -100 (left) through 100 (right). 0 is centered. */
  imagePanX?: number;
  spineGapFill?: SpineGapFill;
  hideStripe?: boolean;
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

export function isSpiralBinding(config: {
  binding?: CoverBinding;
  coverKind?: CoverKind | "page";
}) {
  return config.binding === "spiral" || config.coverKind === "page";
}

export function isSinglePageCover(config: {
  binding?: CoverBinding;
  coverKind?: CoverKind | "page";
}) {
  return isSpiralBinding(config);
}

export function artboardCm(binding?: CoverBinding) {
  return binding === "hardcover"
    ? {
        width: HARDCOVER_ARTBOARD_WIDTH_CM,
        height: HARDCOVER_ARTBOARD_HEIGHT_CM,
      }
    : { width: ARTBOARD_WIDTH_CM, height: ARTBOARD_HEIGHT_CM };
}

/** Gap before a hardcover panel image. Premade artboards already include their own edges. */
export function spineImageGapCm(config: {
  binding?: CoverBinding;
  coverKind?: CoverKind;
  imageFromSpine?: boolean;
}) {
  if (config.binding !== "hardcover" || config.coverKind === "premade")
    return 0;
  if (config.imageFromSpine) return 0;
  return HARDCOVER_SPINE_GAP_CM;
}

export function isPremadeCover(config: { coverKind?: CoverKind }) {
  return config.coverKind === "premade";
}

/** Front and back are both full cover images; there is no description stripe. */
export function isDoubleCover(config: { coverKind?: CoverKind }) {
  return config.coverKind === "double";
}

export function pageDimsCm(
  pageSize: CoverPageSize = "a4",
  orientation: PageOrientation = "vertical",
) {
  if (pageSize === "a5") {
    return orientation === "horizontal"
      ? { width: A5_HEIGHT_CM, height: A5_WIDTH_CM }
      : { width: A5_WIDTH_CM, height: A5_HEIGHT_CM };
  }
  if (pageSize === "b5") return { width: B5_WIDTH_CM, height: B5_HEIGHT_CM };
  return { width: A4_WIDTH_CM, height: A4_HEIGHT_CM };
}

/** Landscape is only for a soft A5 wrap or double cover. */
export function pageOrientationOf(config: {
  binding?: CoverBinding;
  coverKind?: CoverKind;
  pageSize?: CoverPageSize;
  pageOrientation?: PageOrientation;
}): PageOrientation {
  const softA5 =
    config.binding !== "hardcover" &&
    config.binding !== "spiral" &&
    (config.coverKind === "wrap" || config.coverKind === "double") &&
    (config.pageSize ?? "a4") === "a5";
  return softA5 && config.pageOrientation === "horizontal"
    ? "horizontal"
    : "vertical";
}

export function cmToPx(cm: number, dpi: number): number {
  return (cm / 2.54) * dpi;
}

/** Opaque backing store so the preview is not composited against the page. */
function drawingContext(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (ctx) ctx.imageSmoothingQuality = "high";
  return ctx;
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
  /** Scaled centimetres between a panel image and the spine. */
  imageGap: number;
};

export function layoutCoverCm(
  pages: number,
  coverSide: CoverSide,
  pagesPerCm = PAGES_PER_SPINE_CM,
  pageSize: CoverPageSize = "a4",
  stripe?: Partial<StripeLayoutCm>,
  hideSpine = false,
  boardWidthCm = ARTBOARD_WIDTH_CM,
  imageGapCm = 0,
  boardHeightCm = ARTBOARD_HEIGHT_CM,
  orientation: PageOrientation = "vertical",
): CoverLayoutCm {
  const dims = pageDimsCm(pageSize, orientation);
  const metrics = {
    ...defaultStripeLayout(pageSize),
    ...Object.fromEntries(
      Object.entries(stripe ?? {}).filter(
        ([, value]) => typeof value === "number" && Number.isFinite(value),
      ),
    ),
  } as StripeLayoutCm;
  const wrapCm = wrapWidthCm(pages, pagesPerCm, dims.width, hideSpine);
  const fitScale = wrapCm > boardWidthCm ? boardWidthCm / wrapCm : 1;
  const a4W = dims.width * fitScale;
  const spineW = hideSpine ? 0 : spineWidthCm(pages, pagesPerCm) * fitScale;
  const wrapW = a4W * 2 + spineW;
  const originX = (boardWidthCm - wrapW) / 2;
  const height = dims.height * fitScale;
  // Hardcover's sheet is taller than the page. Keep the page its own height
  // and center it, instead of stretching the image to the sheet.
  const originY =
    boardHeightCm > ARTBOARD_HEIGHT_CM
      ? Math.max(0, (boardHeightCm - height) / 2)
      : 0;
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
    imageGap: imageGapCm * fitScale,
  };
}

/**
 * Safe guide on a hardcover page. It starts at the spine, or at the gap.
 * From the spine the A4 guide is 20.5×27. After the gap it is 19.5×27.
 * B5 stays the full 17×25 cm page.
 */
export function hardcoverGuideFrameCm(
  pageSize: CoverPageSize,
  fromSpine = true,
) {
  if (pageSize === "b5") return { width: 17, height: 25 };
  return fromSpine ? { width: 20.5, height: 27 } : { width: 19.5, height: 27 };
}

/**
 * Spine mode covers this window. Gap mode uses that same picture and removes
 * 1 cm from the far end, so the window is 1 cm narrower and starts 1 cm out.
 */
export function hardcoverImageFrameCm(
  pageSize: CoverPageSize,
  fromSpine: boolean,
) {
  if (pageSize === "b5") {
    return fromSpine ? { width: 19, height: 26 } : { width: 18, height: 26 };
  }
  return fromSpine ? { width: 21.5, height: 28 } : { width: 20.5, height: 28 };
}

/** The image window for the current spine/gap choice. */
export function hardcoverImageGuideFrames(
  pageSize: CoverPageSize,
  fromSpine: boolean,
) {
  return [
    { ...hardcoverImageFrameCm(pageSize, fromSpine), gap: fromSpine ? 0 : 1 },
  ];
}

/**
 * The box starts at the spine, or one gap past it, and runs away from the
 * spine. Vertically it is centered on the page.
 */
export function frameFromSpineCm(
  panelX: number,
  panelY: number,
  panelW: number,
  panelH: number,
  frameW: number,
  frameH: number,
  gap: number,
  spineOnLeft: boolean,
) {
  return {
    x: spineOnLeft ? panelX + gap : panelX + panelW - gap - frameW,
    y: panelY + (panelH - frameH) / 2,
    w: frameW,
    h: frameH,
  };
}

export type GuideLine =
  | { axis: "x"; cm: number; kind: "trim" | "fold" | "stripe" | "center" }
  | { axis: "y"; cm: number; kind: "trim" | "fold" | "stripe" | "center" }
  | {
      axis: "rect";
      x: number;
      y: number;
      w: number;
      h: number;
      kind: "safe" | "image";
      /** Which horizontal edge of the box carries the width. */
      widthEdge?: "top" | "bottom";
      /** 0–1 across the box. Keeps two width numbers off the same spot. */
      widthAlong?: number;
      showHeight?: boolean;
      /** Which side of the box gets the height number. */
      heightSide?: "left" | "right";
      /** 0–1 down the box. Keeps two height numbers off the same spot. */
      heightAlong?: number;
    }
  | {
      axis: "label";
      x: number;
      y: number;
      cm: number;
      rotate?: boolean;
      kind?: "stripe";
    };

/**
 * Guide positions on the artboard, in centimetres. Trim edges, spine folds,
 * the stripe box, and the centre lines of each panel.
 */
export function coverGuidesCm(
  layout: CoverLayoutCm,
  gapOnBack = false,
  contentFrame?: { width: number; height: number } | null,
  imageFrames: { width: number; height: number; gap: number }[] = [],
): GuideLine[] {
  const top = layout.originY;
  const bottom = layout.originY + layout.height;
  // Hardcover's sheet is wider than the page, so the left and right page
  // edges are extra outer lines. Skip that pair and the height number on it.
  const insetPage = layout.originY > 0.05;
  const guides: GuideLine[] = [
    { axis: "y", cm: top, kind: "trim" },
    { axis: "y", cm: bottom, kind: "trim" },
  ];
  if (!insetPage) {
    guides.push(
      { axis: "x", cm: layout.originX, kind: "trim" },
      { axis: "x", cm: layout.originX + layout.wrapW, kind: "trim" },
    );
  }
  guides.push(
    { axis: "x", cm: layout.spineX, kind: "fold" },
    { axis: "x", cm: layout.spineX + layout.spineW, kind: "fold" },
    { axis: "x", cm: layout.stripeX, kind: "stripe" },
    { axis: "x", cm: layout.stripeX + layout.stripeW, kind: "stripe" },
    { axis: "x", cm: layout.frontX + layout.a4W / 2, kind: "center" },
    { axis: "x", cm: layout.backX + layout.a4W / 2, kind: "center" },
    { axis: "y", cm: (top + bottom) / 2, kind: "center" },
  );
  if (layout.spineW > 0.05) {
    guides.push({
      axis: "x",
      cm: layout.spineX + layout.spineW / 2,
      kind: "center",
    });
  }
  if (layout.imageGap > 0.05) {
    const gap = layout.imageGap;
    const frontGap = layout.frontOnLeft
      ? layout.frontX + layout.a4W - gap
      : layout.frontX + gap;
    guides.push({ axis: "x", cm: frontGap, kind: "fold" });
    if (gapOnBack) {
      const backGap = layout.frontOnLeft
        ? layout.backX + gap
        : layout.backX + layout.a4W - gap;
      guides.push({ axis: "x", cm: backGap, kind: "fold" });
    }
  }
  if (contentFrame) {
    const frameW = contentFrame.width * layout.fitScale;
    const frameH = contentFrame.height * layout.fitScale;
    const place = (panelX: number, spineOnLeft: boolean) => {
      const frame = frameFromSpineCm(
        panelX,
        layout.originY,
        layout.a4W,
        layout.height,
        frameW,
        frameH,
        layout.imageGap,
        spineOnLeft,
      );
      guides.push({
        axis: "rect",
        x: frame.x,
        y: frame.y,
        w: frame.w,
        h: frame.h,
        kind: "safe",
        widthEdge: "top",
        widthAlong: 0.72,
        heightSide: spineOnLeft ? "left" : "right",
        heightAlong: 0.68,
      });
    };
    place(layout.frontX, !layout.frontOnLeft);
    if (gapOnBack) place(layout.backX, layout.frontOnLeft);
  }
  for (const imageFrame of imageFrames) {
    const frameW = imageFrame.width * layout.fitScale;
    const frameH = imageFrame.height * layout.fitScale;
    const frameGap = imageFrame.gap * layout.fitScale;
    const placeImage = (panelX: number, spineOnLeft: boolean) => {
      const frame = frameFromSpineCm(
        panelX,
        layout.originY,
        layout.a4W,
        layout.height,
        frameW,
        frameH,
        frameGap,
        spineOnLeft,
      );
      guides.push({
        axis: "rect",
        x: frame.x,
        y: frame.y,
        w: frame.w,
        h: frame.h,
        kind: "image",
        widthEdge: "top",
        widthAlong: 0.28,
        showHeight: true,
        heightSide: spineOnLeft ? "right" : "left",
        heightAlong: 0.32,
      });
    };
    placeImage(layout.frontX, !layout.frontOnLeft);
    if (gapOnBack) placeImage(layout.backX, layout.frontOnLeft);
  }
  guides.push(
    {
      axis: "label",
      x: layout.frontX + layout.a4W / 2,
      y: bottom,
      cm: layout.a4W,
    },
    {
      axis: "label",
      x: layout.backX + layout.a4W / 2,
      y: bottom,
      cm: layout.a4W,
    },
  );
  if (!insetPage) {
    guides.push({
      axis: "label",
      x: layout.originX,
      y: top + layout.height / 2,
      cm: layout.height,
      rotate: true,
    });
  }
  if (layout.spineW > 0.05) {
    guides.push({
      axis: "label",
      x: layout.spineX + layout.spineW / 2,
      y: bottom,
      cm: layout.spineW,
    });
  }
  if (layout.stripeW > 0.05) {
    guides.push({
      axis: "label",
      x: layout.stripeX + layout.stripeW / 2,
      y: top,
      cm: layout.stripeW,
      kind: "stripe",
    });
  }
  if (layout.imageGap > 0.05) {
    guides.push({
      axis: "label",
      x: layout.frontOnLeft
        ? layout.frontX + layout.a4W - layout.imageGap / 2
        : layout.frontX + layout.imageGap / 2,
      y: top + layout.height / 2,
      cm: layout.imageGap,
      rotate: true,
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
    { axis: "label", x: width / 2, y: height, cm: width },
    {
      axis: "label",
      x: 0,
      y: height / 2,
      cm: height,
      rotate: true,
    },
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

  const flush = () => {
    if (!current) return;
    lines.push(current);
    current = "";
  };

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (widthOf(next) <= maxWidth) {
      current = next;
      continue;
    }
    flush();
    if (widthOf(word) <= maxWidth) {
      current = word;
      continue;
    }
    lines.push(...breakLongWord(word, maxWidth, widthOf));
  }
  flush();
  return lines;
}

/** Cuts a word that is wider than the line into pieces that each fit. */
function breakLongWord(
  word: string,
  maxWidth: number,
  widthOf: (value: string) => number,
): string[] {
  const parts: string[] = [];
  let rest = word;
  while (rest) {
    if (widthOf(rest) <= maxWidth) {
      parts.push(rest);
      break;
    }
    let lo = 1;
    let hi = rest.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (widthOf(rest.slice(0, mid)) <= maxWidth) lo = mid;
      else hi = mid - 1;
    }
    const take = Math.max(1, lo);
    parts.push(rest.slice(0, take));
    rest = rest.slice(take);
  }
  return parts;
}

export function hexToRgb01(hex: string): { r: number; g: number; b: number } {
  const [r, g, b] = parseHex(hex);
  return { r: r / 255, g: g / 255, b: b / 255 };
}

/** Hardcover image pan, clamped to the slider range. */
export function clampCoverImagePan(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(-100, value));
}

/**
 * Horizontal origin of a cover-scaled hardcover image.
 * Pan 0 crops the fitted overflow equally. A gap window keeps that
 * placement and clips the extra centimetre from the far end.
 */
export function hardcoverImageOriginX(args: {
  x: number;
  width: number;
  drawW: number;
  fitWidth: number;
  spineOnLeft: boolean;
  pan: number | undefined;
}) {
  const gap = Math.max(0, args.fitWidth - args.width);
  const fitX = args.spineOnLeft ? args.x - gap : args.x;
  const slack = Math.max(0, args.drawW - args.fitWidth);
  const centered = fitX + (args.fitWidth - args.drawW) / 2;
  const pushed = args.spineOnLeft ? centered + gap : centered - gap;
  return pushed + (clampCoverImagePan(args.pan) / 100) * (slack / 2);
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
    hideStripe = false,
  } = options;
  if (isSpiralBinding(options)) {
    drawSinglePageCanvas(canvas, options);
    return;
  }
  if (isPremadeCover(options)) {
    drawPremadeCanvas(canvas, options);
    return;
  }

  const board = artboardCm(options.binding);
  const widthPx = Math.round(cmToPx(board.width, dpi));
  const heightPx = Math.round(cmToPx(board.height, dpi));
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
    board.width,
    spineImageGapCm(options),
    board.height,
    pageOrientationOf(options),
  );
  const p = (cm: number) => cmToPx(cm, dpi);

  canvas.width = widthPx;
  canvas.height = heightPx;

  const ctx = drawingContext(canvas);
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
  const gap = p(layout.imageGap);
  const frontSpineOnLeft = !frontOnLeft;
  const backSpineOnLeft = frontOnLeft;
  const contentFrame =
    options.binding === "hardcover"
      ? hardcoverImageFrameCm(pageSize ?? "a4", options.imageFromSpine === true)
      : null;
  const fittedFrame =
    options.binding === "hardcover"
      ? hardcoverImageFrameCm(pageSize ?? "a4", true)
      : null;
  const fittedPx = fittedFrame
    ? {
        w: p(fittedFrame.width * layout.fitScale),
        h: p(fittedFrame.height * layout.fitScale),
      }
    : null;
  const cropEnd = contentFrame != null;
  const contentBox = (panelX: number, spineOnLeft: boolean) => {
    if (!contentFrame) return null;
    const frame = frameFromSpineCm(
      panelX,
      originY,
      a4W,
      coverH,
      p(contentFrame.width * layout.fitScale),
      p(contentFrame.height * layout.fitScale),
      gap,
      spineOnLeft,
    );
    return { x: frame.x, y: frame.y, w: frame.w, h: frame.h };
  };
  ctx.fillStyle = fill;
  ctx.fillRect(backX, originY, a4W, coverH);
  if (!hideSpine) ctx.fillRect(spineX, originY, Math.max(1, spineW), coverH);
  if (double && options.backImage && options.backImage.naturalWidth > 0) {
    drawPanelImage(
      ctx,
      options.backImage,
      backX,
      originY,
      a4W,
      coverH,
      gap,
      backSpineOnLeft,
      options.spineGapFill ?? "color",
      contentBox(backX, backSpineOnLeft),
      fill,
      cropEnd,
      fittedPx,
      options.imagePanX ?? 0,
    );
  }
  if (!double && !hideStripe) {
    ctx.fillStyle = stripeFill;
    ctx.fillRect(stripeX, originY, stripeW, coverH);
  }

  if (!double && !hideStripe)
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

  ctx.fillStyle = fill;
  ctx.fillRect(frontX, originY, a4W, coverH);

  if (sourceImage && sourceImage.naturalWidth > 0) {
    drawPanelImage(
      ctx,
      sourceImage,
      frontX,
      originY,
      a4W,
      coverH,
      gap,
      frontSpineOnLeft,
      options.spineGapFill ?? "color",
      contentBox(frontX, frontSpineOnLeft),
      fill,
      cropEnd,
      fittedPx,
      options.imagePanX ?? 0,
    );
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

function drawPremadeCanvas(
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
    chapterLabelColor,
    chapterLabelX,
    chapterLabelY,
    chapterLabelSizeCm,
    spineMarkColor,
    spineTextColor,
    hideSpineText = false,
    titleFont,
    labelFont,
    titleWeight,
    labelWeight,
    chapterNumber,
    pagesPerSpineCm,
    pageSize,
  } = options;
  const board = artboardCm(options.binding);
  const widthPx = Math.round(cmToPx(board.width, dpi));
  const heightPx = Math.round(cmToPx(board.height, dpi));
  const fill = coverColor || DEFAULT_COVER_COLOR;
  const titleFamily = titleFont || "CoverMontserratTitle";
  const chapterFamily = labelFont || titleFamily;
  const spineWeight = titleWeight ?? 600;
  const chapterWeight = labelWeight ?? 700;
  const layout = layoutCoverCm(
    pages,
    coverSide,
    pagesPerSpineCm,
    pageSize,
    undefined,
    false,
    board.width,
  );
  const p = (cm: number) => cmToPx(cm, dpi);
  const ctx = drawingContext(canvas);
  if (!ctx) return;

  canvas.width = widthPx;
  canvas.height = heightPx;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, widthPx, heightPx);

  if (sourceImage && sourceImage.naturalWidth > 0) {
    const mirror = coverSide === "rtl";
    if ((pageSize ?? "a4") === "a5" || (pageSize ?? "a4") === "b5") {
      drawPremadeImage(
        ctx,
        sourceImage,
        p(layout.originX),
        p(layout.originY),
        p(layout.wrapW),
        p(layout.height),
        "contain",
        mirror,
      );
    } else {
      drawPremadeImage(
        ctx,
        sourceImage,
        0,
        0,
        widthPx,
        heightPx,
        "contain",
        mirror,
      );
    }
  }

  const originY = p(layout.originY);
  const spineW = p(layout.spineW);
  const frontX = p(layout.frontX);
  const spineX = p(layout.spineX);
  const a4W = p(layout.a4W);
  const coverH = p(layout.height);
  const frontOnLeft = layout.frontOnLeft;

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

  const title = bookName.trim();
  if (title) {
    drawCoverTitle(ctx, {
      x: frontX,
      y: originY,
      width: a4W,
      height: coverH,
      label: title,
      color: options.frontTitleColor?.trim() || contrastHex(fill),
      dpi,
      xRatio: options.frontTitleX ?? 50,
      yRatio: options.frontTitleY ?? 30,
      sizeCm: options.frontTitleSizeCm,
      sizeClamp: clampFrontTitleSize,
      fontFamily: titleFamily,
      fontWeight: spineWeight,
      shadow: options.frontTitleShadow,
      wrap: true,
      align: options.frontTitleAlign,
      leading: options.frontTitleLeading,
    });
  }

  if (label) {
    drawCoverTitle(ctx, {
      x: frontX,
      y: originY,
      width: a4W,
      height: coverH,
      label,
      color: chapterLabelColor || DEFAULT_CHAPTER_LABEL_COLOR,
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
    coverSide,
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
  const ctx = drawingContext(canvas);
  if (!ctx) return;

  canvas.width = widthPx;
  canvas.height = heightPx;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, widthPx, heightPx);
  if (sourceImage && sourceImage.naturalWidth > 0) {
    if (isPremadeCover(options)) {
      drawPremadeImage(
        ctx,
        sourceImage,
        0,
        0,
        widthPx,
        heightPx,
        "edge",
        coverSide === "rtl",
      );
    } else {
      drawImageCovering(ctx, sourceImage, 0, 0, widthPx, heightPx);
    }
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
  if (isPremadeCover(options) && options.bookName.trim()) {
    const titleFamily = options.titleFont || "CoverMontserratTitle";
    drawCoverTitle(ctx, {
      x: 0,
      y: 0,
      width: widthPx,
      height: heightPx,
      label: options.bookName.trim(),
      color:
        options.frontTitleColor?.trim() ||
        contrastHex(coverColor || DEFAULT_COVER_COLOR),
      dpi,
      xRatio: options.frontTitleX ?? 50,
      yRatio: options.frontTitleY ?? 30,
      sizeCm: options.frontTitleSizeCm,
      sizeClamp: clampFrontTitleSize,
      fontFamily: titleFamily,
      fontWeight: options.titleWeight ?? 600,
      shadow: options.frontTitleShadow,
      wrap: true,
      align: options.frontTitleAlign,
      leading: options.frontTitleLeading,
    });
  }
}

/**
 * Premade art: `contain` letterboxes a smaller page inside its box.
 * `edge` fits the height and pins the artwork to the right, or to the left
 * after an Arabic mirror, instead of showing the middle of the artboard.
 */
function drawPremadeImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  placement: "contain" | "edge",
  mirror: boolean,
) {
  const scale =
    placement === "edge"
      ? height / image.naturalHeight
      : Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawW = image.naturalWidth * scale;
  const drawH = image.naturalHeight * scale;
  const dx =
    placement === "edge"
      ? mirror
        ? x
        : x + width - drawW
      : x + (width - drawW) / 2;
  const dy = placement === "edge" ? y : y + (height - drawH) / 2;

  ctx.save();
  if (placement === "edge") {
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
  }
  if (mirror) {
    ctx.translate(dx + drawW, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(image, 0, 0, drawW, drawH);
  } else {
    ctx.drawImage(image, dx, dy, drawW, drawH);
  }
  ctx.restore();
}

function drawImageCovering(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  cropEnd = false,
  spineOnLeft = true,
  fitWidth = width,
  fitHeight = height,
  imagePan = 0,
) {
  // Cover the spine window. The extra width is cropped equally unless the
  // pan slider moves it. Gap mode keeps that scale and clips 1 cm off the far end.
  const scale = cropEnd
    ? Math.max(fitWidth / image.naturalWidth, fitHeight / image.naturalHeight)
    : Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawW = image.naturalWidth * scale;
  const drawH = image.naturalHeight * scale;
  const dx = cropEnd
    ? hardcoverImageOriginX({
        x,
        width,
        drawW,
        fitWidth,
        spineOnLeft,
        pan: imagePan,
      })
    : x + (width - drawW) / 2;
  const dy = y + (height - drawH) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.drawImage(image, dx, dy, drawW, drawH);
  ctx.restore();
}

/**
 * A strip of the page-cropped image's spine edge, stretched and blurred so it
 * can fill the centimetre between the sharp image and the spine.
 */
export function blurredEdgeCanvas(
  image: HTMLImageElement,
  imageWidth: number,
  imageHeight: number,
  gapWidth: number,
  edge: "left" | "right",
  cropEnd = false,
  imagePan = 0,
): HTMLCanvasElement | null {
  if (
    image.naturalWidth < 1 ||
    imageWidth < 1 ||
    imageHeight < 1 ||
    gapWidth < 1 ||
    typeof document === "undefined"
  )
    return null;
  const covered = document.createElement("canvas");
  covered.width = Math.max(1, Math.round(imageWidth));
  covered.height = Math.max(1, Math.round(imageHeight));
  const coveredCtx = covered.getContext("2d");
  if (!coveredCtx) return null;
  const scale = Math.max(
    covered.width / image.naturalWidth,
    covered.height / image.naturalHeight,
  );
  const drawW = image.naturalWidth * scale;
  const drawH = image.naturalHeight * scale;
  coveredCtx.drawImage(
    image,
    cropEnd
      ? hardcoverImageOriginX({
          x: 0,
          width: covered.width,
          drawW,
          fitWidth: covered.width,
          spineOnLeft: edge === "left",
          pan: imagePan,
        })
      : (covered.width - drawW) / 2,
    (covered.height - drawH) / 2,
    drawW,
    drawH,
  );

  const slice = Math.max(1, Math.round(Math.min(covered.width * 0.08, 48)));
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(gapWidth));
  out.height = covered.height;
  const outCtx = out.getContext("2d");
  if (!outCtx) return null;
  outCtx.filter = `blur(${Math.max(8, Math.round(out.width * 0.35))}px)`;
  outCtx.drawImage(
    covered,
    edge === "left" ? 0 : covered.width - slice,
    0,
    slice,
    covered.height,
    -slice,
    0,
    out.width + slice * 2,
    out.height,
  );
  return out;
}

function drawPanelImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  panelX: number,
  panelY: number,
  panelW: number,
  panelH: number,
  gap: number,
  spineOnLeft: boolean,
  fill: SpineGapFill,
  frame: { x: number; y: number; w: number; h: number } | null,
  gapColor: string,
  cropEnd = false,
  fit: { w: number; h: number } | null = null,
  imagePan = 0,
) {
  const box = frame ?? { x: panelX, y: panelY, w: panelW, h: panelH };
  const visibleX = spineOnLeft ? panelX + gap : panelX;
  const visibleW = panelW - gap;
  ctx.save();
  ctx.beginPath();
  if (frame) ctx.rect(box.x, box.y, box.w, box.h);
  else if (gap > 0 && visibleW > 1)
    ctx.rect(visibleX, panelY, visibleW, panelH);
  else ctx.rect(panelX, panelY, panelW, panelH);
  ctx.clip();
  drawImageCovering(
    ctx,
    image,
    box.x,
    box.y,
    box.w,
    box.h,
    cropEnd,
    spineOnLeft,
    fit?.w ?? box.w,
    fit?.h ?? box.h,
    imagePan,
  );
  ctx.restore();
  if (gap < 1) return;
  const gapX = spineOnLeft ? panelX : panelX + panelW - gap;
  if (fill === "blur") {
    const blurred = blurredEdgeCanvas(
      image,
      fit?.w ?? box.w,
      fit?.h ?? box.h,
      gap,
      spineOnLeft ? "left" : "right",
      cropEnd,
      imagePan,
    );
    if (blurred) {
      const blurY = frame ? box.y : panelY;
      const blurH = frame ? box.h : panelH;
      ctx.drawImage(blurred, gapX, blurY, gap, blurH);
    }
    return;
  }
  if (frame) {
    ctx.fillStyle = gapColor;
    ctx.fillRect(gapX, panelY, gap, panelH);
  }
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
    sizeClamp?: (value: number | undefined) => number;
    fontFamily: string;
    fontWeight: number;
    shadow?: boolean;
    /** Keep the chosen size and wrap overflow onto the next lines. */
    wrap?: boolean;
    align?: "left" | "center" | "right";
    /** Baseline distance as a multiple of the font size. */
    leading?: number;
  },
) {
  const pad = cmToPx(args.wrap ? 0.3 : 1.2, args.dpi);
  const xRatio = Math.min(1, Math.max(0, (args.xRatio ?? 50) / 100));
  const yRatio = Math.min(1, Math.max(0, (args.yRatio ?? 88) / 100));
  const align = args.align ?? "center";
  const textX = args.x + pad + (args.width - pad * 2) * xRatio;
  const textY = args.y + pad + (args.height - pad * 2) * yRatio;

  ctx.save();
  ctx.fillStyle = args.color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.direction = isRtlText(args.label) ? "rtl" : "ltr";
  if (args.shadow !== false) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = Math.max(4, args.dpi * 0.04);
  }
  const fontSize = cmToPx(
    (args.sizeClamp ?? clampChapterLabelSize)(args.sizeCm),
    args.dpi,
  );
  ctx.font = `${args.fontWeight} ${fontSize}px "${args.fontFamily}", sans-serif`;
  const maxWidth = Math.max(1, args.width - pad * 2);
  if (args.wrap) {
    const lines = wrapWords(
      args.label,
      maxWidth,
      (value) => ctx.measureText(value).width,
    );
    const rendered = lines.length > 0 ? lines : [args.label];
    const leading = args.leading ?? 1.25;
    const lineHeight = fontSize * Math.max(0.8, leading);
    rendered.forEach((line, index) => {
      ctx.fillText(line, textX, textY + index * lineHeight);
    });
  } else {
    ctx.fillText(args.label, textX, textY, maxWidth);
  }
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

  const edgeMargin = cmToPx(spineNumberFromTopCm(args.pageSize), args.dpi);
  const zoneTop = chapterNumber
    ? numberFromTop + numberAlong + minGap
    : edgeMargin;
  const zoneBottom = chapterNumber
    ? args.height - markH - edge
    : args.height - edgeMargin;
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
