import fontkit from "@pdf-lib/fontkit";
import {
  PDFDocument,
  clip,
  endPath,
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
import {
  fetchCoverFontBytes,
  getCoverFontPair,
  type CoverFontSpec,
} from "./cover-fonts";
import {
  ARTBOARD_HEIGHT_CM,
  ARTBOARD_WIDTH_CM,
  DEFAULT_COVER_COLOR,
  SPINE_MARK_HEIGHT_CM,
  SPINE_MARK_WIDTH_CM,
  STRIPE_INSET_CM,
  STRIPE_TEXT,
  cmToPt,
  contrastHex,
  fileSafeName,
  isSinglePageCover,
  loadCoverImage,
  pageDimsCm,
  readableOn,
  sampleChapterBackdrop,
  hexToRgb01,
  layoutCoverCm,
  resolveChapters,
  shiftHex,
  wrapWords,
} from "./cover-layout";

const NOTO_NASKH_URL =
  "https://cdn.jsdelivr.net/gh/notofonts/notonaskharabic@main/fonts/NotoNaskhArabic/full/ttf/NotoNaskhArabic-Regular.ttf";

let notoFontBytes: ArrayBuffer | null = null;

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
    return await pdf.embedFont(new Uint8Array(bytes), {
      subset: weight != null,
    });
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

async function loadNotoFont() {
  if (notoFontBytes) return notoFontBytes;
  const response = await fetch(NOTO_NASKH_URL);
  if (!response.ok) throw new Error("تعذّر تحميل خط النص العربي.");
  notoFontBytes = await response.arrayBuffer();
  return notoFontBytes;
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
  const scale = Math.max(
    box.width / image.width,
    box.height / image.height,
  );
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
  let x = left;
  for (const word of words) {
    page.drawText(word, { x, y, size, font, color: fill });
    x += font.widthOfTextAtSize(word, size) + gap;
  }
}

function drawCenteredSpineTitle(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  cx: number,
  cy: number,
  angle: number,
  fill: RGB,
) {
  const width = font.widthOfTextAtSize(text, size);
  const ascent = font.heightAtSize(size, { descender: false });
  const descent = font.heightAtSize(size, { descender: true }) - ascent;
  const midline = (ascent - descent) / 2;

  page.pushOperators(
    pushGraphicsState(),
    translate(cx, cy),
    rotateDegrees(angle),
  );
  page.drawText(text, {
    x: -width / 2,
    y: -midline,
    size,
    font,
    color: fill,
  });
  page.pushOperators(popGraphicsState());
}

async function drawVectorCover(args: {
  sourceUrl: string;
  bookConfig: BookConfig;
  showGuides: boolean;
  pages: number;
  label: string;
  coverImageElement?: HTMLImageElement | null;
  chapterNumber?: string;
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
  try {
    arabic = await pdf.embedFont(await loadNotoFont());
  } catch {
    arabic = null;
  }
  const coverImage = await embedCoverImage(pdf, args.sourceUrl);

  const singlePage = isSinglePageCover(args.bookConfig);
  const dims = pageDimsCm(args.bookConfig.pageSize ?? "a4");
  const pageWidth = cmToPt(singlePage ? dims.width : ARTBOARD_WIDTH_CM);
  const pageHeight = cmToPt(singlePage ? dims.height : ARTBOARD_HEIGHT_CM);
  const page = pdf.addPage([pageWidth, pageHeight]);
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
  const stripeHex = readableOn(args.bookConfig.stripeForeground, stripeFillHex);
  const labelHex = readableOn(args.bookConfig.chapterLabelColor, labelBackdrop);
  const markHex = readableOn(args.bookConfig.spineMarkColor, fillHex);
  const stripeText =
    args.bookConfig.bookDescription?.trim() || STRIPE_TEXT;
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
      const chapterFont = fontForText(args.label, labelFace, arabic, pair);
      const padLabel = cmToPt(1.2);
      const xRatio = Math.min(1, Math.max(0, (args.bookConfig.chapterLabelX ?? 50) / 100));
      const yRatio = Math.min(1, Math.max(0, (args.bookConfig.chapterLabelY ?? 88) / 100));
      const size = Math.min(cmToPt(0.9), front.width * 0.08);
      const maxLabel = front.width - padLabel * 2;
      const textX = front.x + padLabel + maxLabel * xRatio;
      const textYTop = padLabel + (dims.height - 2.4) * yRatio;
      const width = Math.min(chapterFont.widthOfTextAtSize(args.label, size), maxLabel);
      page.drawText(args.label, {
        x: textX - width / 2,
        y: topY(pageHeight, textYTop) - size * 0.35,
        size,
        font: chapterFont,
        color: color(labelHex),
        maxWidth: maxLabel,
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
  page.drawRectangle({ ...stripe, color: color(stripeFillHex) });

  const padX = cmToPt(args.stripeInsetCm ?? STRIPE_INSET_CM);
  const padY = cmToPt(args.stripeInsetCm ?? STRIPE_INSET_CM);
  const maxWidth = stripe.width - padX * 2;
  const fontSize = cmToPt(0.42);
  const lineHeight = fontSize * 1.45;
  const stripeFont = fontForText(stripeText, descriptionFont, arabic, pair);
  const lines = wrapWords(stripeText, maxWidth, (value) =>
    stripeFont.widthOfTextAtSize(value, fontSize),
  );
  const blockHeight = (lines.length - 1) * lineHeight;
  const startY = stripe.y + stripe.height / 2 + blockHeight / 2 - fontSize * 0.35;
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
  const spineInk = color(contrastHex(fillHex));
  const cx = cmToPt(layout.spineX + layout.spineW / 2);

  if ((title || chapterNumber) && layout.spineW > 0.08) {
    const numberFont = titleFont;
    const spineFont = fontForText(title, titleFont, arabic, pair);
    const size = Math.min(
      cmToPt(layout.spineW * 0.55),
      cmToPt(layout.height * 0.04),
    );
    const numSize = size;
    const gap = cmToPt(0.1);
    const markH = cmToPt(SPINE_MARK_HEIGHT_CM);
    const maxTitle = cmToPt(layout.height * 0.86);
    const titleLen = title
      ? Math.min(spineFont.widthOfTextAtSize(title, size), maxTitle)
      : 0;
    const numAscent = chapterNumber
      ? numberFont.heightAtSize(numSize, { descender: false })
      : 0;
    const numFull = chapterNumber
      ? numberFont.heightAtSize(numSize, { descender: true })
      : 0;
    const numBlock = chapterNumber ? numFull + gap : 0;
    const block = numBlock + titleLen;
    const minTop = spine.y + markH + gap;
    const maxTop = spine.y + spine.height - markH - gap;
    const midY = spine.y + spine.height / 2;
    const groupTop = Math.min(
      Math.max(midY + block / 2, minTop + block),
      maxTop,
    );
    const topEdge = groupTop - block;

    if (chapterNumber) {
      const numWidth = numberFont.widthOfTextAtSize(chapterNumber, numSize);
      page.drawText(chapterNumber, {
        x: cx - numWidth / 2,
        y: topEdge + block - numAscent,
        size: numSize,
        font: numberFont,
        color: spineInk,
      });
    }
    if (title) {
      drawCenteredSpineTitle(
        page,
        title,
        spineFont,
        size,
        cx,
        topEdge + titleLen / 2,
        layout.frontOnLeft ? 90 : -90,
        spineInk,
      );
    }
  }

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

  page.drawRectangle({ ...front, color: color("#e7e1d4") });
  drawCoverImage(page, coverImage, front);

  if (args.label) {
    const labelFont = fontForText(args.label, labelFace, arabic, pair);
    const padLabel = cmToPt(1.2);
    const xRatio = Math.min(1, Math.max(0, (args.bookConfig.chapterLabelX ?? 50) / 100));
    const yRatio = Math.min(1, Math.max(0, (args.bookConfig.chapterLabelY ?? 88) / 100));
    const size = Math.min(cmToPt(0.9), front.width * 0.08);
    const maxLabel = front.width - padLabel * 2;
    const textX = front.x + padLabel + maxLabel * xRatio;
    const textYTop = padLabel + (layout.height - 2.4) * yRatio;
    const width = Math.min(labelFont.widthOfTextAtSize(args.label, size), maxLabel);
    page.drawText(args.label, {
      x: textX - width / 2,
      y: topY(pageHeight, textYTop) - size * 0.35,
      size,
      font: labelFont,
      color: color(labelHex),
      maxWidth: maxLabel,
    });
  }

  if (args.showGuides) {
    const xs = [
      layout.originX,
      layout.spineX,
      layout.spineX + layout.spineW,
      layout.originX + layout.wrapW,
    ];
    for (const xCm of xs) {
      const x = cmToPt(xCm);
      page.drawLine({
        start: { x, y: spine.y },
        end: { x, y: spine.y + spine.height },
        thickness: 0.6,
        color: rgb(0.27, 0.24, 0.19),
        opacity: 0.55,
        dashArray: [6, 4],
      });
    }
  }

  return pdf.save();
}

export async function exportCoverPdf(args: {
  sourceUrl: string;
  bookConfig: BookConfig;
  showGuides: boolean;
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

  for (const [index, chapter] of chapters.entries()) {
    const bytes = await drawVectorCover({
      sourceUrl: args.sourceUrl,
      bookConfig: args.bookConfig,
      showGuides: args.showGuides,
      pages: chapter.pages,
      label: showTitle ? chapter.label : "",
      coverImageElement,
      chapterNumber: chapters.length > 1 ? String(chapter.index) : undefined,
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
