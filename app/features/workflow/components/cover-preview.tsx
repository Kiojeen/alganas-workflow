import { useEffect, useMemo, useRef, useState } from "react";
import { Book02Icon, ImageUploadIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useModels } from "../context";
import {
  showsChapterTitle,
  unassignedPagesError,
} from "../lib/chapter-division";
import { formatSpineNumber } from "../lib/chapter-labels";
import { ensureCoverFonts, getCoverFontPair } from "../lib/cover-fonts";
import {
  artboardCm,
  clampChapterLabelSize,
  clampFrontTitleSize,
  contrastHex,
  coverGuidesCm,
  DEFAULT_COVER_COLOR,
  drawCoverOnCanvas,
  hardcoverGuideFrameCm,
  hardcoverImageGuideFrames,
  isDoubleCover,
  isPremadeCover,
  isSinglePageCover,
  layoutCoverCm,
  pageDimsCm,
  resolveChapters,
  sampleChapterBackdrop,
  shiftHex,
  singlePageGuidesCm,
  spineHiddenFor,
  spineImageGapCm,
  spineWidthCm,
  stripeForPage,
  wrapWidthCm,
  type GuideLine,
} from "../lib/cover-layout";
import type { BookConfig } from "../types";

/** Illustrator-style guides: hairlines in cyan, drawn at screen resolution. */
const GUIDE_COLOR = "#2bc9ff";

function formatGuideCm(cm: number) {
  const rounded = Math.round(cm * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text} سم`;
}

function drawGuides(
  overlay: HTMLCanvasElement,
  guides: GuideLine[],
  boardWidthCm: number,
  boardHeightCm: number,
  showNumbers: boolean,
) {
  const cssWidth = overlay.clientWidth;
  const cssHeight = overlay.clientHeight;
  if (cssWidth <= 0 || cssHeight <= 0) return;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  overlay.width = Math.round(cssWidth * dpr);
  overlay.height = Math.round(cssHeight * dpr);
  const ctx = overlay.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  ctx.lineWidth = 1;
  const px = (cm: number, total: number, size: number) =>
    Math.round((cm / total) * size) + 0.5;

  for (const guide of guides) {
    ctx.beginPath();
    ctx.setLineDash(
      guide.kind === "center" || guide.kind === "image"
        ? [4 * dpr, 4 * dpr]
        : [],
    );
    ctx.strokeStyle = GUIDE_COLOR;
    ctx.globalAlpha = guide.kind === "center" ? 0.7 : 1;
    if (guide.axis === "rect") {
      const x = px(guide.x, boardWidthCm, overlay.width);
      const y = px(guide.y, boardHeightCm, overlay.height);
      const w = (guide.w / boardWidthCm) * overlay.width;
      const h = (guide.h / boardHeightCm) * overlay.height;
      ctx.strokeRect(x, y, w, h);
      if (!showNumbers) continue;
      ctx.save();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = GUIDE_COLOR;
      ctx.font = `${Math.round(11 * dpr)}px sans-serif`;
      ctx.textAlign = "center";
      const widthAtBottom = guide.widthLabel === "bottom";
      ctx.textBaseline = widthAtBottom ? "bottom" : "top";
      ctx.fillText(
        formatGuideCm(guide.w),
        x + w / 2,
        widthAtBottom ? y + h - 4 * dpr : y + 4 * dpr,
      );
      if (guide.showHeight !== false) {
        const onRight = guide.heightSide === "right";
        ctx.translate(onRight ? x + w - 4 * dpr : x + 4 * dpr, y + h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textBaseline = onRight ? "top" : "bottom";
        ctx.fillText(formatGuideCm(guide.h), 0, 0);
      }
      ctx.restore();
      continue;
    }
    if (guide.axis === "label") {
      if (!showNumbers) continue;
      const x = (guide.x / boardWidthCm) * overlay.width;
      const y = (guide.y / boardHeightCm) * overlay.height;
      ctx.save();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = GUIDE_COLOR;
      ctx.font = `${Math.round(11 * dpr)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.translate(x, y);
      if (guide.rotate) ctx.rotate(-Math.PI / 2);
      ctx.fillText(formatGuideCm(guide.cm), 0, 0);
      ctx.restore();
      continue;
    }
    if (guide.axis === "x") {
      const x = px(guide.cm, boardWidthCm, overlay.width);
      ctx.moveTo(x, 0);
      ctx.lineTo(x, overlay.height);
    } else {
      const y = px(guide.cm, boardHeightCm, overlay.height);
      ctx.moveTo(0, y);
      ctx.lineTo(overlay.width, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function CoverPreview({
  sourceImage,
  image,
  backImage = null,
  bookConfig,
  chapterIndex,
  onChapterIndexChange,
  showLines,
  showNumbers,
}: {
  sourceImage: string | null;
  image: HTMLImageElement | null;
  backImage?: HTMLImageElement | null;
  bookConfig: BookConfig;
  chapterIndex: number;
  onChapterIndexChange: (index: number) => void;
  showLines: boolean;
  showNumbers: boolean;
}) {
  const { pagesPerSpineCm, stripeA4, stripeA5 } = useModels();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const configRef = useRef(bookConfig);
  configRef.current = bookConfig;
  const [fontsReady, setFontsReady] = useState(false);

  const chapters = useMemo(() => resolveChapters(bookConfig), [bookConfig]);
  const allocationError = unassignedPagesError(bookConfig);
  const safeIndex = Math.min(chapterIndex, chapters.length - 1);
  const chapter = chapters[safeIndex];
  const hasChapters = chapters.length > 1;
  const fontPair = getCoverFontPair(bookConfig.fontPair);
  const pageSize = bookConfig.pageSize ?? "a4";
  const pageDims = pageDimsCm(pageSize);
  const singlePage = isSinglePageCover(bookConfig);
  const double = isDoubleCover(bookConfig);
  const premade = isPremadeCover(bookConfig);
  const board = artboardCm(bookConfig.binding);
  const boardWidth = singlePage ? pageDims.width : board.width;
  const boardHeight = singlePage ? pageDims.height : board.height;
  const stripeLayout = stripeForPage(pageSize, stripeA4, stripeA5);
  const hideSpineText = spineHiddenFor(
    chapter.pages,
    pagesPerSpineCm,
    bookConfig.forceSpine,
  );
  const naturalSpineCm = spineWidthCm(chapter.pages, pagesPerSpineCm);
  const wrapCm = wrapWidthCm(chapter.pages, pagesPerSpineCm, pageDims.width);
  const coverColor = bookConfig.coverColor || DEFAULT_COVER_COLOR;
  const stripeColor = bookConfig.stripeColor || shiftHex(coverColor, -18);
  const stripeForeground =
    bookConfig.stripeForeground.trim() || contrastHex(stripeColor);
  const chapterLabelX = bookConfig.chapterLabelX ?? 50;
  const chapterLabelY = bookConfig.chapterLabelY ?? 88;
  const chapterLabelSizeCm = clampChapterLabelSize(
    bookConfig.chapterLabelSizeCm,
  );
  const chapterBackdrop = sampleChapterBackdrop(
    image,
    pageDims.width,
    pageDims.height,
    chapterLabelX,
    chapterLabelY,
  );
  const labelContrast = bookConfig.chapterLabelContrast !== false;
  const chapterLabelColor = labelContrast
    ? contrastHex(chapterBackdrop)
    : bookConfig.chapterLabelColor.trim() || contrastHex(chapterBackdrop);
  const chapterLabelShadow = bookConfig.chapterLabelShadow !== false;
  const frontTitleX = bookConfig.frontTitleX ?? 50;
  const frontTitleY = bookConfig.frontTitleY ?? 30;
  const frontTitleSizeCm = clampFrontTitleSize(bookConfig.frontTitleSizeCm);
  const frontTitleBackdrop = sampleChapterBackdrop(
    image,
    pageDims.width,
    pageDims.height,
    frontTitleX,
    frontTitleY,
  );
  const frontTitleColor =
    bookConfig.frontTitleContrast !== false
      ? contrastHex(frontTitleBackdrop)
      : bookConfig.frontTitleColor.trim() || contrastHex(frontTitleBackdrop);
  const frontTitleShadow = bookConfig.frontTitleShadow !== false;
  const spineMarkColor =
    bookConfig.spineMarkColor.trim() || contrastHex(coverColor);
  const spineTextColor =
    bookConfig.spineTextColor?.trim() || contrastHex(coverColor);
  const chapterTitle = showsChapterTitle(bookConfig) ? chapter.label : "";
  const coverSide = bookConfig.coverSide ?? "rtl";
  const guidesOn = showLines;

  useEffect(() => {
    let cancelled = false;
    void ensureCoverFonts().then(() => {
      if (!cancelled) setFontsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!container || !canvas || !overlay) return;

    const guides = (
      !guidesOn
        ? []
        : singlePage
          ? singlePageGuidesCm(boardWidth, boardHeight)
          : coverGuidesCm(
              layoutCoverCm(
                chapter.pages,
                coverSide,
                pagesPerSpineCm,
                pageSize,
                {
                  widthCm: stripeLayout.widthCm,
                  insetCm: stripeLayout.insetCm,
                  edgeGapCm: stripeLayout.edgeGapCm,
                },
                false,
                boardWidth,
                spineImageGapCm(bookConfig),
                boardHeight,
              ),
              double,
              bookConfig.binding === "hardcover" && !premade
                ? hardcoverGuideFrameCm(pageSize)
                : null,
              bookConfig.binding === "hardcover" && !premade
                ? hardcoverImageGuideFrames(
                    pageSize,
                    bookConfig.imageFromSpine === true,
                  )
                : [],
            )
    ).filter((guide) => !(double || premade) || guide.kind !== "stripe");

    const paint = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      const aspect = boardWidth / boardHeight;
      let cssWidth = width;
      let cssHeight = width / aspect;
      if (cssHeight > height) {
        cssHeight = height;
        cssWidth = height * aspect;
      }
      cssWidth = Math.max(1, cssWidth);
      cssHeight = Math.max(1, cssHeight);
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const bitmapWidth = Math.max(1, Math.round(cssWidth * dpr));
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      overlay.style.width = `${cssWidth}px`;
      overlay.style.height = `${cssHeight}px`;
      drawCoverOnCanvas(canvas, {
        sourceImage: image,
        backImage,
        pages: chapter.pages,
        label: chapterTitle,
        bookName: bookConfig.bookName ?? "",
        coverSide,
        coverKind: bookConfig.coverKind ?? "wrap",
        binding: bookConfig.binding ?? "standard",
        dpi: (bitmapWidth / boardWidth) * 2.54,
        coverColor,
        stripeColor,
        stripeForeground,
        chapterLabelColor,
        chapterLabelX,
        chapterLabelY,
        chapterLabelSizeCm,
        chapterLabelShadow,
        stripeText: bookConfig.bookDescription,
        spineMarkColor,
        spineTextColor,
        hideSpineText,
        descriptionScale: fontPair.descriptionScale,
        titleFont: fontPair.titleFamily,
        descriptionFont: fontPair.descriptionFamily,
        labelFont: fontPair.labelFamily,
        titleWeight: fontPair.titleWeight,
        descriptionWeight: fontPair.descriptionWeight,
        labelWeight: fontPair.labelWeight,
        chapterNumber:
          !singlePage && hasChapters
            ? formatSpineNumber(bookConfig.chapterLabel, chapter.index)
            : undefined,
        pagesPerSpineCm,
        pageSize,
        stripeWidthCm: stripeLayout.widthCm,
        stripeInsetCm: stripeLayout.insetCm,
        stripeEdgeGapCm: stripeLayout.edgeGapCm,
        frontTitleX,
        frontTitleY,
        frontTitleSizeCm,
        frontTitleAlign: bookConfig.frontTitleAlign ?? "center",
        frontTitleLeading: bookConfig.frontTitleLeading ?? 1.25,
        frontTitleColor,
        frontTitleShadow,
        imageFromSpine: bookConfig.imageFromSpine,
        spineGapFill: bookConfig.spineGapFill,
      });
      if (guides.length > 0) {
        drawGuides(overlay, guides, boardWidth, boardHeight, showNumbers);
      } else {
        overlay
          .getContext("2d")
          ?.clearRect(0, 0, overlay.width, overlay.height);
      }
    };

    const frame = requestAnimationFrame(paint);
    const resizeObserver = new ResizeObserver(paint);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [
    image,
    backImage,
    chapter.pages,
    chapterTitle,
    chapter.index,
    hasChapters,
    coverSide,
    bookConfig.coverKind,
    bookConfig.binding,
    bookConfig.chapterLabel,
    singlePage,
    boardWidth,
    boardHeight,
    bookConfig.bookName,
    bookConfig.bookDescription,
    coverColor,
    stripeColor,
    stripeForeground,
    chapterLabelColor,
    chapterLabelX,
    chapterLabelY,
    chapterLabelSizeCm,
    chapterLabelShadow,
    spineMarkColor,
    spineTextColor,
    hideSpineText,
    guidesOn,
    fontPair.descriptionScale,
    fontPair.titleFamily,
    fontPair.descriptionFamily,
    fontPair.labelFamily,
    fontPair.titleWeight,
    fontPair.descriptionWeight,
    fontPair.labelWeight,
    fontsReady,
    pagesPerSpineCm,
    pageSize,
    stripeLayout.widthCm,
    stripeLayout.insetCm,
    stripeLayout.edgeGapCm,
    premade,
    frontTitleX,
    frontTitleY,
    frontTitleSizeCm,
    frontTitleColor,
    frontTitleShadow,
    bookConfig.frontTitleAlign,
    bookConfig.frontTitleLeading,
    bookConfig.imageFromSpine,
    showNumbers,
    bookConfig.spineGapFill,
  ]);

  const spineNote = hideSpineText
    ? `الكعب ${naturalSpineCm.toFixed(2)} سم بلا نص`
    : `الكعب ${naturalSpineCm.toFixed(2)} سم من ${chapter.pages} صفحة`;

  return (
    <section
      className="flex min-h-0 flex-col gap-3 p-4 lg:h-full"
      aria-label="معاينة الغلاف"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        {hasChapters ? (
          <Select
            value={String(safeIndex)}
            onValueChange={(value) => onChapterIndexChange(Number(value))}
          >
            <SelectTrigger
              className="w-60 max-w-full"
              size="sm"
              aria-label="الفصل المعروض"
            >
              <HugeiconsIcon
                icon={Book02Icon}
                className="text-muted-foreground size-3.5 shrink-0"
                strokeWidth={2}
              />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {chapters.map((item, index) => (
                <SelectItem
                  key={`${item.label}-${index}`}
                  value={String(index)}
                >
                  {item.label || `غلاف ${item.index}`}
                  <span className="text-muted-foreground ms-2 text-[11px] tabular-nums">
                    {item.pages} صفحة
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-muted-foreground text-xs">
            غلاف واحد · {chapter.pages} صفحة
          </span>
        )}
      </div>

      <div
        ref={containerRef}
        className="bg-muted/40 relative h-60 w-full overflow-hidden rounded-lg border sm:h-72 lg:h-auto lg:min-h-0 lg:flex-1"
      >
        <canvas
          ref={canvasRef}
          className={cn(
            "absolute inset-0 m-auto block rounded-sm shadow-md",
            !sourceImage && "opacity-60",
          )}
        />
        <canvas
          ref={overlayRef}
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 m-auto block",
            !guidesOn && "hidden",
          )}
        />
        {!sourceImage && (
          <div className="bg-background/80 text-muted-foreground pointer-events-none absolute inset-x-6 top-1/2 mx-auto flex max-w-xs -translate-y-1/2 flex-col items-center gap-2 rounded-md border px-4 py-3 text-center text-xs backdrop-blur">
            <HugeiconsIcon icon={ImageUploadIcon} className="size-5" />
            {premade
              ? "اختر غلافًا جاهزًا من المكتبة لتظهر المعاينة هنا."
              : "ارفع صورة الغلاف أو ملف PDF لتظهر المعاينة هنا."}
          </div>
        )}
      </div>

      {allocationError ? (
        <p className="text-destructive text-xs font-medium" role="alert">
          {allocationError}
        </p>
      ) : (
        <p className="text-muted-foreground text-[11px] leading-relaxed">
          {singlePage
            ? `غلاف حلزوني · صفحة ${pageSize.toUpperCase()} واحدة (${pageDims.width}×${pageDims.height} سم). ملف PDF لكل فصل: ${chapters.length}.`
            : `اللوحة ${boardWidth}×${boardHeight} سم · الغلاف ${pageSize.toUpperCase()} ${pageDims.width}×${pageDims.height} سم · ${spineNote}${double || premade ? " · بلا شريط" : ` · الشريط ${stripeLayout.widthCm} سم`} · العرض الكلي ${wrapCm.toFixed(2)} سم.`}
        </p>
      )}
    </section>
  );
}
