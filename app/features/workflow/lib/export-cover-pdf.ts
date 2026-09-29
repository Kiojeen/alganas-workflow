import fontkit from "@pdf-lib/fontkit";
import {
  clip,
  endPath,
  PDFDocument,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  rgb,
  rotateDegrees,
  translate,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  type RGB,
} from "pdf-lib";

import type { BookConfig, CoverSide } from "../types";
import { showsChapterTitle, unassignedPagesError } from "./chapter-division";
import { formatSpineNumber } from "./chapter-labels";
import {
  ensureCoverFonts,
  fetchCoverFontBytes,
  getCoverFontPair,
  type CoverFontSpec,
} from "./cover-fonts";
import {
  ARTBOARD_HEIGHT_CM,
  ARTBOARD_WIDTH_CM,
  clampChapterLabelSize,
  cmToPt,
  contrastHex,
  DEFAULT_COVER_COLOR,
  fileSafeName,
  fitSpineTitle,
  hexToRgb01,
  isRtlText,
  isSinglePageCover,
  layoutCoverCm,
  loadCoverImage,
  pageDimsCm,
  resolveChapters,
  sampleChapterBackdrop,
  shiftHex,
  SPINE_MARK_HEIGHT_CM,
  SPINE_MARK_WIDTH_CM,
  SPINE_TITLE_MIN_GAP_CM,
  spineHiddenFor,
  spineNumberFontSize,
  spineNumberFromTopCm,
  spineNumberLines,
  STRIPE_INSET_CM,
  STRIPE_TEXT,
  STRIPE_TEXT_SIZE_CM,
  wrapWords,
} from "./cover-layout";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Saves the cover image (uploaded or generated) under the book's name. */
export async function downloadCoverImage(sourceUrl: string, baseName: string) {
  const blob = await fetch(sourceUrl).then((response) => response.blob());
  const type = blob.type || "image/png";
  const ext = /jpe?g/i.test(type) ? "jpg" : /webp/i.test(type) ? "webp" : "png";
  downloadBlob(blob, `${baseName}.${ext}`);
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function color(hex: string): RGB {
  const { r, g, b } = hexToRgb01(hex);
  return rgb(r, g, b);
}

function hasArabic(value: string) {
  return /[\u0600-\u06FF]/.test(value);
}

let variationWeight: number | undefined;

const weightingFontkit = {
  create(buffer: ArrayBuffer | Uint8Array) {
    const bytes =
      buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const font = fontkit.create(bytes) as {
      getVariation?: (settings: { wght: number }) => unknown;
    };
    if (variationWeight == null || typeof font.getVariation !== "function") {
      return font;
    }
    try {
      return font.getVariation({ wght: variationWeight });
    } catch {
      return font;
    }
  },
};

async function embedCoverFace(
  pdf: PDFDocument,
  bytes: ArrayBuffer,
  weight?: number,
) {
  variationWeight = weight;
  try {
    return await pdf.embedFont(new Uint8Array(bytes), { subset: true });
  } finally {
    variationWeight = undefined;
  }
}

function fontForText(
  text: string,
  preferred: PDFFont,
  arabic: PDFFont | null,
  pair: CoverFontSpec,
) {
  if (pair.category === "english" && hasArabic(text) && arabic) return arabic;
  return preferred;
}

/** The browser font face that `fontForText` would pick for the chapter label. */
function labelFaceFor(text: string, pair: CoverFontSpec) {
  if (pair.category === "english" && hasArabic(text)) {
    const fallback = getCoverFontPair("montserrat-arabic");
    return {
      family: fallback.descriptionFamily,
      weight: fallback.descriptionWeight,
    };
  }
  return { family: pair.labelFamily, weight: pair.labelWeight };
}

function topRect(
  pageHeight: number,
  xCm: number,
  yCm: number,
  wCm: number,
  hCm: number,
) {
  return {
    x: cmToPt(xCm),
    y: pageHeight - cmToPt(yCm + hCm),
    width: cmToPt(wCm),
    height: cmToPt(hCm),
  };
}

function topY(pageHeight: number, yCm: number) {
  return pageHeight - cmToPt(yCm);
}

async function embedCoverImage(pdf: PDFDocument, sourceUrl: string) {
  const response = await fetch(sourceUrl);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const header = sourceUrl.slice(0, 32);
  const jpeg =
    bytes[0] === 0xff && bytes[1] === 0xd8
      ? true
      : /image\/jpe?g/i.test(header);
  const png = bytes[0] === 0x89 && bytes[1] === 0x50;
  try {
    if (jpeg) return await pdf.embedJpg(bytes);
    if (png) return await pdf.embedPng(bytes);
  } catch {
    // fall through and re-encode
  }
  const image = await loadCoverImage(sourceUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذّر تجهيز صورة الغلاف.");
  ctx.drawImage(image, 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) resolve(value);
      else reject(new Error("تعذّر ترميز صورة الغلاف."));
    }, "image/png");
  });
  return pdf.embedPng(await blob.arrayBuffer());
}

function drawCoverImage(
  page: PDFPage,
  image: PDFImage,
  box: { x: number; y: number; width: number; height: number },
) {
  const scale = Math.max(box.width / image.width, box.height / image.height);
  const drawW = image.width * scale;
  const drawH = image.height * scale;
  const x = box.x + (box.width - drawW) / 2;
  const y = box.y + (box.height - drawH) / 2;
  page.pushOperators(
    pushGraphicsState(),
    rectangle(box.x, box.y, box.width, box.height),
    clip(),
    endPath(),
  );
  page.drawImage(image, { x, y, width: drawW, height: drawH });
  page.pushOperators(popGraphicsState());
}

function drawJustifiedLine(
  page: PDFPage,
  font: PDFFont,
  line: string,
  centerX: number,
  left: number,
  y: number,
  maxWidth: number,
  size: number,
  fill: RGB,
  isLast: boolean,
) {
  const words = line.split(/\s+/).filter(Boolean);
  if (isLast || words.length < 2) {
    const width = font.widthOfTextAtSize(line, size);
    page.drawText(line, {
      x: centerX - width / 2,
      y,
      size,
      font,
      color: fill,
    });
    return;
  }
  const total = words.reduce(
    (sum, word) => sum + font.widthOfTextAtSize(word, size),
    0,
  );
  const gap = (maxWidth - total) / (words.length - 1);
  if (isRtlText(line)) {
    // First word sits at the right edge; later words step leftwards.
    let right = left + maxWidth;
    for (const word of words) {
      const width = font.widthOfTextAtSize(word, size);
      page.drawText(word, { x: right - width, y, size, font, color: fill });
      right -= width + gap;
    }
    return;
  }
  let x = left;
  for (const word of words) {
    page.drawText(word, { x, y, size, font, color: fill });
    x += font.widthOfTextAtSize(word, size) + gap;
  }
}

/** Resolution of the rasterised label shadow, in dots per inch. */
const SHADOW_DPI = 300;
/** Same softness as the preview: blur radius in points (0.04 in). */
const SHADOW_BLUR_PT = 0.04 * 72;
const SHADOW_ALPHA = 0.45;

/**
 * PDF has no blur primitive, so the soft shadow is the one part of the label
 * that is rasterised: the glyphs are drawn on a canvas with the same font and
 * blur as the preview, then embedded as a transparent bitmap beneath the
 * vector text. Returns null when the browser cannot render it.
 */
async function renderLabelShadow(args: {
  label: string;
  family: string;
  weight: number;
  sizePt: number;
  ascentPt: number;
  descentPt: number;
  widthPt: number;
}): Promise<{
  png: Uint8Array;
  widthPt: number;
  heightPt: number;
  marginPt: number;
} | null> {
  if (typeof document === "undefined") return null;
  await ensureCoverFonts();
  const scale = SHADOW_DPI / 72;
  const marginPt = SHADOW_BLUR_PT * 3;
  const widthPt = args.widthPt + marginPt * 2;
  const heightPt = args.ascentPt + args.descentPt + marginPt * 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(widthPt * scale));
  canvas.height = Math.max(1, Math.ceil(heightPt * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  // Draw the glyphs far off-canvas and let only their shadow land in frame.
  const shift = canvas.width * 4;
  ctx.font = `${args.weight} ${args.sizePt * scale}px "${args.family}", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = isRtlText(args.label) ? "rtl" : "ltr";
  ctx.fillStyle = "#000";
  ctx.shadowColor = `rgba(0, 0, 0, ${SHADOW_ALPHA})`;
  ctx.shadowBlur = SHADOW_BLUR_PT * scale;
  ctx.shadowOffsetX = shift;
  ctx.fillText(
    args.label,
    canvas.width / 2 - shift,
    (marginPt + args.ascentPt) * scale,
  );
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) return null;
  return {
    png: new Uint8Array(await blob.arrayBuffer()),
    widthPt,
    heightPt,
    marginPt,
  };
}

/** Mirrors the canvas `drawCoverTitle`: centered on a padded point inside `box`. */
async function drawChapterLabel(
  pdf: PDFDocument,
  page: PDFPage,
  args: {
    label: string;
    font: PDFFont;
    /** Browser-side face matching `font`, used to rasterise the shadow. */
    face: { family: string; weight: number };
    box: { x: number; y: number; width: number; height: number };
    xPercent: number;
    yPercent: number;
    sizeCm?: number;
    fill: RGB;
    shadow?: boolean;
  },
) {
  const { label, font, box } = args;
  const pad = cmToPt(1.2);
  const xRatio = Math.min(1, Math.max(0, args.xPercent / 100));
  const yRatio = Math.min(1, Math.max(0, args.yPercent / 100));
  const maxWidth = box.width - pad * 2;
  const centerX = box.x + pad + maxWidth * xRatio;
  const centerY = box.y + box.height - pad - (box.height - pad * 2) * yRatio;
  let size = cmToPt(clampChapterLabelSize(args.sizeCm));
  const natural = font.widthOfTextAtSize(label, size);
  if (natural > maxWidth) size *= maxWidth / natural;
  const width = font.widthOfTextAtSize(label, size);
  const ascent = font.heightAtSize(size, { descender: false });
  const descent = font.heightAtSize(size, { descender: true }) - ascent;
  const textY = centerY - (ascent - descent) / 2;
  const textX = centerX - width / 2;
  if (args.shadow !== false) {
    const shadow = await renderLabelShadow({
      label,
      family: args.face.family,
      weight: args.face.weight,
      sizePt: size,
      ascentPt: ascent,
      descentPt: descent,
      widthPt: width,
    });
    if (shadow) {
      const image = await pdf.embedPng(shadow.png);
      page.drawImage(image, {
        x: centerX - shadow.widthPt / 2,
        y: textY - descent - shadow.marginPt,
        width: shadow.widthPt,
        height: shadow.heightPt,
      });
    }
  }
  page.drawText(label, {
    x: textX,
    y: textY,
    size,
    font,
    color: args.fill,
  });
}

function drawRotatedSpineLines(
  page: PDFPage,
  args: {
    lines: string[];
    font: PDFFont;
    size: number;
    cx: number;
    cy: number;
    angle: number;
    fill: RGB;
  },
) {
  const { font, size, lines } = args;
  const ascent = font.heightAtSize(size, { descender: false });
  const descent = font.heightAtSize(size, { descender: true }) - ascent;
  const midline = (ascent - descent) / 2;
  const lineGap = size * 0.2;
  page.pushOperators(
    pushGraphicsState(),
    translate(args.cx, args.cy),
    rotateDegrees(args.angle),
  );
  lines.forEach((line, index) => {
    const width = font.widthOfTextAtSize(line, size);
    const offset =
      lines.length === 1 ? 0 : (index === 0 ? -1 : 1) * ((size + lineGap) / 2);
    page.drawText(line, {
      x: -width / 2,
      y: offset - midline,
      size,
      font,
      color: args.fill,
    });
  });
  page.pushOperators(popGraphicsState());
}

async function drawVectorCover(args: {
  sourceUrl: string;
  bookConfig: BookConfig;
  pages: number;
  label: string;
  coverImageElement?: HTMLImageElement | null;
  chapterNumber?: string;
  backSourceUrl?: string | null;
  pagesPerSpineCm?: number;
  stripeWidthCm?: number;
  stripeInsetCm?: number;
  stripeEdgeGapCm?: number;
}) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(weightingFontkit as unknown as typeof fontkit);
  const pair = getCoverFontPair(args.bookConfig.fontPair);
  const titleBuffer = await fetchCoverFontBytes(pair.titleFile);
  const titleFont = await embedCoverFace(
    pdf,
    titleBuffer,
    pair.variable ? pair.titleWeight : undefined,
  );
  const descriptionFont =
    pair.descriptionFile === pair.titleFile
      ? pair.variable
        ? await embedCoverFace(pdf, titleBuffer, pair.descriptionWeight)
        : titleFont
      : await embedCoverFace(
          pdf,
          await fetchCoverFontBytes(pair.descriptionFile),
        );
  const labelFace = pair.labelFromDescription ? descriptionFont : titleFont;
  let arabic: PDFFont | null = null;
  if (pair.category === "english") {
    try {
      arabic = await embedCoverFace(
        pdf,
        await fetchCoverFontBytes(
          getCoverFontPair("montserrat-arabic").descriptionFile,
        ),
      );
    } catch {
      arabic = null;
    }
  }
  const coverImage = await embedCoverImage(pdf, args.sourceUrl);
  const double = args.bookConfig.coverKind === "double";
  const backImage =
    double && args.backSourceUrl
      ? await embedCoverImage(pdf, args.backSourceUrl).catch(() => null)
      : null;

  const singlePage = isSinglePageCover(args.bookConfig);
  const dims = pageDimsCm(args.bookConfig.pageSize ?? "a4");
  const pageWidth = cmToPt(singlePage ? dims.width : ARTBOARD_WIDTH_CM);
  const pageHeight = cmToPt(singlePage ? dims.height : ARTBOARD_HEIGHT_CM);
  const page = pdf.addPage([pageWidth, pageHeight]);
  const hideSpineText = spineHiddenFor(
    args.pages,
    args.pagesPerSpineCm,
    args.bookConfig.forceSpine,
  );
  const layout = layoutCoverCm(
    args.pages,
    (args.bookConfig.coverSide ?? "rtl") as CoverSide,
    args.pagesPerSpineCm,
    args.bookConfig.pageSize ?? "a4",
    {
      widthCm: args.stripeWidthCm,
      insetCm: args.stripeInsetCm,
      edgeGapCm: args.stripeEdgeGapCm,
    },
  );
  const fillHex = args.bookConfig.coverColor || DEFAULT_COVER_COLOR;
  const stripeFillHex =
    args.bookConfig.stripeColor?.trim() || shiftHex(fillHex, -18);
  const pageSize = args.bookConfig.pageSize ?? "a4";
  const panel = pageDimsCm(pageSize);
  const labelBackdrop = sampleChapterBackdrop(
    args.coverImageElement ?? null,
    panel.width,
    panel.height,
    args.bookConfig.chapterLabelX ?? 50,
    args.bookConfig.chapterLabelY ?? 88,
  );
  const stripeHex =
    args.bookConfig.stripeForeground?.trim() || contrastHex(stripeFillHex);
  const labelContrast = args.bookConfig.chapterLabelContrast !== false;
  const labelHex = labelContrast
    ? contrastHex(labelBackdrop)
    : args.bookConfig.chapterLabelColor?.trim() || contrastHex(labelBackdrop);
  const labelShadow = args.bookConfig.chapterLabelShadow !== false;
  const markHex =
    args.bookConfig.spineMarkColor?.trim() || contrastHex(fillHex);
  const stripeText = args.bookConfig.bookDescription?.trim() || STRIPE_TEXT;
  const bookName = args.bookConfig.bookName ?? "";

  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: color(fillHex),
  });

  if (singlePage) {
    const front = topRect(pageHeight, 0, 0, dims.width, dims.height);
    drawCoverImage(page, coverImage, front);
    if (args.label) {
      await drawChapterLabel(pdf, page, {
        label: args.label,
        font: fontForText(args.label, labelFace, arabic, pair),
        face: labelFaceFor(args.label, pair),
        box: front,
        xPercent: args.bookConfig.chapterLabelX ?? 50,
        yPercent: args.bookConfig.chapterLabelY ?? 88,
        sizeCm: args.bookConfig.chapterLabelSizeCm,
        fill: color(labelHex),
        shadow: labelShadow,
      });
    }
    return pdf.save();
  }

  const back = topRect(
    pageHeight,
    layout.backX,
    layout.originY,
    layout.a4W,
    layout.height,
  );
  const spine = topRect(
    pageHeight,
    layout.spineX,
    layout.originY,
    Math.max(layout.spineW, 0.02),
    layout.height,
  );
  const stripe = topRect(
    pageHeight,
    layout.stripeX,
    layout.originY,
    layout.stripeW,
    layout.height,
  );
  const front = topRect(
    pageHeight,
    layout.frontX,
    layout.originY,
    layout.a4W,
    layout.height,
  );

  page.drawRectangle({ ...back, color: color(fillHex) });
  page.drawRectangle({ ...spine, color: color(fillHex) });
  if (backImage) drawCoverImage(page, backImage, back);
  if (!double) page.drawRectangle({ ...stripe, color: color(stripeFillHex) });

  const padX = cmToPt(args.stripeInsetCm ?? STRIPE_INSET_CM);
  const padY = cmToPt(args.stripeInsetCm ?? STRIPE_INSET_CM);
  const maxWidth = stripe.width - padX * 2;
  const fontSize = cmToPt(STRIPE_TEXT_SIZE_CM * (pair.descriptionScale ?? 1));
  const lineHeight = fontSize * 1.45;
  const stripeFont = fontForText(stripeText, descriptionFont, arabic, pair);
  const lines = double
    ? []
    : wrapWords(stripeText, maxWidth, (value) =>
        stripeFont.widthOfTextAtSize(value, fontSize),
      );
  const blockHeight = (lines.length - 1) * lineHeight;
  const startY =
    stripe.y + stripe.height / 2 + blockHeight / 2 - fontSize * 0.35;
  const left = stripe.x + padX;
  const centerX = stripe.x + stripe.width / 2;
  for (const [index, line] of lines.entries()) {
    const y = startY - index * lineHeight;
    if (y < stripe.y + padY || y > stripe.y + stripe.height - padY) continue;
    drawJustifiedLine(
      page,
      stripeFont,
      line,
      centerX,
      left,
      y,
      maxWidth,
      fontSize,
      color(stripeHex),
      index === lines.length - 1,
    );
  }

  const title = bookName.trim();
  const chapterNumber = args.chapterNumber?.trim() ?? "";
  const spineInk = color(
    args.bookConfig.spineTextColor?.trim() || contrastHex(fillHex),
  );
  const cx = cmToPt(layout.spineX + layout.spineW / 2);

  if (!hideSpineText && (title || chapterNumber) && layout.spineW > 0.08) {
    const numberFont = fontForText(chapterNumber, titleFont, arabic, pair);
    const spineFont = fontForText(title, titleFont, arabic, pair);
    const baseSize = Math.min(
      cmToPt(layout.spineW * 0.55),
      cmToPt(layout.height * 0.04),
    );
    const markH = cmToPt(SPINE_MARK_HEIGHT_CM);
    const edge = cmToPt(0.15);
    const minGap = cmToPt(SPINE_TITLE_MIN_GAP_CM);
    const spineTop = spine.y + spine.height;
    const angle = layout.frontOnLeft ? 90 : -90;
    let numberSize = spineNumberFontSize(baseSize, chapterNumber);
    const numberFromTop = chapterNumber
      ? cmToPt(spineNumberFromTopCm(args.bookConfig.pageSize))
      : 0;
    const zoneBottom = spine.height - markH - edge;
    const numberLines = spineNumberLines(chapterNumber);
    if (numberLines.length > 0) {
      const maxNumberWidth = spine.width * 0.92;
      const widest = Math.max(
        ...numberLines.map((line) =>
          numberFont.widthOfTextAtSize(line, numberSize),
        ),
      );
      if (widest > maxNumberWidth && widest > 0) {
        numberSize *= maxNumberWidth / widest;
      }
    }
    const numberLineHeight = numberSize * 1.1;
    const numberAlong =
      numberLines.length > 0
        ? numberLineHeight * (numberLines.length - 1) +
          numberFont.heightAtSize(numberSize, { descender: true })
        : 0;
    const zoneTop = chapterNumber
      ? numberFromTop + numberAlong + minGap
      : markH + edge;
    const fitted = title
      ? fitSpineTitle({
          title,
          maxAlong: Math.max(1, zoneBottom - zoneTop),
          maxAcross: spine.width,
          size: baseSize,
          widthOf: (text, size) => spineFont.widthOfTextAtSize(text, size),
        })
      : null;

    if (numberLines.length > 0) {
      const ascent = numberFont.heightAtSize(numberSize, { descender: false });
      numberLines.forEach((line, index) => {
        const lineWidth = numberFont.widthOfTextAtSize(line, numberSize);
        page.drawText(line, {
          x: cx - lineWidth / 2,
          y: spineTop - numberFromTop - ascent - index * numberLineHeight,
          size: numberSize,
          font: numberFont,
          color: spineInk,
        });
      });
    }
    if (fitted) {
      const ideal = spine.height / 2;
      const minCenter = zoneTop + fitted.along / 2;
      const maxCenter = zoneBottom - fitted.along / 2;
      const centerFromTop =
        minCenter <= maxCenter
          ? Math.min(Math.max(ideal, minCenter), maxCenter)
          : (zoneTop + zoneBottom) / 2;
      drawRotatedSpineLines(page, {
        lines: fitted.lines,
        font: spineFont,
        size: fitted.size,
        cx,
        cy: spineTop - centerFromTop,
        angle,
        fill: spineInk,
      });
    }
  }

  {
    const markW = cmToPt(SPINE_MARK_WIDTH_CM);
    const markH = cmToPt(SPINE_MARK_HEIGHT_CM);
    const markX = cmToPt(layout.spineX + layout.spineW / 2) - markW / 2;
    page.drawRectangle({
      x: markX,
      y: spine.y + spine.height - markH,
      width: markW,
      height: markH,
      color: color(markHex),
    });
    page.drawRectangle({
      x: markX,
      y: spine.y,
      width: markW,
      height: markH,
      color: color(markHex),
    });
  }

  page.drawRectangle({ ...front, color: color("#e7e1d4") });
  drawCoverImage(page, coverImage, front);

  if (args.label) {
    await drawChapterLabel(pdf, page, {
      label: args.label,
      font: fontForText(args.label, labelFace, arabic, pair),
      face: labelFaceFor(args.label, pair),
      box: front,
      xPercent: args.bookConfig.chapterLabelX ?? 50,
      yPercent: args.bookConfig.chapterLabelY ?? 88,
      sizeCm: args.bookConfig.chapterLabelSizeCm,
      fill: color(labelHex),
      shadow: labelShadow,
    });
  }

  return pdf.save();
}

/**
 * Downloads one PDF per chapter plus the cover image itself, all named after
 * the book. Guides are never part of the export.
 */
export async function exportCoverPdf(args: {
  sourceUrl: string;
  bookConfig: BookConfig;
  backSourceUrl?: string | null;
  pagesPerSpineCm?: number;
  stripeWidthCm?: number;
  stripeInsetCm?: number;
  stripeEdgeGapCm?: number;
}) {
  const unassigned = unassignedPagesError(args.bookConfig);
  if (unassigned) throw new Error(unassigned);
  const chapters = resolveChapters(args.bookConfig);
  const bookTitle = fileSafeName(args.bookConfig.bookName ?? "", "cover");
  const showTitle = showsChapterTitle(args.bookConfig);
  const coverImageElement = await loadCoverImage(args.sourceUrl).catch(
    () => null,
  );

  await downloadCoverImage(args.sourceUrl, bookTitle);
  if (args.bookConfig.coverKind === "double" && args.backSourceUrl) {
    await delay(350);
    await downloadCoverImage(args.backSourceUrl, `${bookTitle}-back`);
  }
  await delay(350);

  for (const [index, chapter] of chapters.entries()) {
    const bytes = await drawVectorCover({
      sourceUrl: args.sourceUrl,
      bookConfig: args.bookConfig,
      pages: chapter.pages,
      label: showTitle ? chapter.label : "",
      coverImageElement,
      chapterNumber:
        chapters.length > 1
          ? formatSpineNumber(args.bookConfig.chapterLabel, chapter.index)
          : undefined,
      // Spine visibility is decided per chapter from its own page count.
      backSourceUrl: args.backSourceUrl,
      pagesPerSpineCm: args.pagesPerSpineCm,
      stripeWidthCm: args.stripeWidthCm,
      stripeInsetCm: args.stripeInsetCm,
      stripeEdgeGapCm: args.stripeEdgeGapCm,
    });
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const chapterPart = chapter.label
      ? fileSafeName(chapter.label, `chapter-${chapter.index}`)
      : "";
    const filename =
      chapters.length > 1 && chapterPart
        ? `${bookTitle}-${chapterPart}.pdf`
        : `${bookTitle}.pdf`;
    downloadBlob(new Blob([copy], { type: "application/pdf" }), filename);

    if (index < chapters.length - 1) {
      await delay(350);
    }
  }
}
