import { useEffect, useMemo, useRef, useState } from "react";
import { Download01Icon, ImageUploadIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";

import { useModels } from "../context";
import {
  showsChapterTitle,
  unassignedPagesError,
} from "../lib/chapter-division";
import { formatSpineNumber } from "../lib/chapter-labels";
import { ensureCoverFonts, getCoverFontPair } from "../lib/cover-fonts";
import {
  ARTBOARD_HEIGHT_CM,
  ARTBOARD_WIDTH_CM,
  clampChapterLabelSize,
  cmToPx,
  contrastHex,
  coverGuidesCm,
  DEFAULT_COVER_COLOR,
  drawCoverOnCanvas,
  isSinglePageCover,
  layoutCoverCm,
  pageDimsCm,
  PREVIEW_DPI,
  resolveChapters,
  sampleChapterBackdrop,
  shiftHex,
  spineWidthCm,
  wrapWidthCm,
  type GuideLine,
} from "../lib/cover-layout";
import type { BookConfig } from "../types";

/** Illustrator-style guides: hairlines in cyan, drawn at screen resolution. */
const GUIDE_COLOR = "#2bc9ff";

function drawGuides(
  overlay: HTMLCanvasElement,
  guides: GuideLine[],
  boardWidthCm: number,
  boardHeightCm: number,
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
    ctx.setLineDash(guide.kind === "center" ? [4 * dpr, 4 * dpr] : []);
    ctx.strokeStyle = GUIDE_COLOR;
    ctx.globalAlpha = guide.kind === "center" ? 0.7 : 1;
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
  bookConfig,
  chapterIndex,
  onChapterIndexChange,
  showLines,
  onShowLinesChange,
  onExport,
  exporting,
  onBookConfigChange,
}: {
  sourceImage: string | null;
  image: HTMLImageElement | null;
  bookConfig: BookConfig;
  chapterIndex: number;
  onChapterIndexChange: (index: number) => void;
  showLines: boolean;
  onShowLinesChange: (value: boolean) => void;
  onExport: () => void;
  exporting: boolean;
  onBookConfigChange: (config: BookConfig) => void;
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
  const chapter = chapters[Math.min(chapterIndex, chapters.length - 1)];
  const hasChapters = chapters.length > 1;
  const fontPair = getCoverFontPair(bookConfig.fontPair);
  const pageSize = bookConfig.pageSize ?? "a4";
  const pageDims = pageDimsCm(pageSize);
  const singlePage = isSinglePageCover(bookConfig);
  const boardWidth = singlePage ? pageDims.width : ARTBOARD_WIDTH_CM;
  const boardHeight = singlePage ? pageDims.height : ARTBOARD_HEIGHT_CM;
  const stripeLayout = pageSize === "a5" ? stripeA5 : stripeA4;
  const spineCm = spineWidthCm(chapter.pages, pagesPerSpineCm);
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
  const chapterLabelColor =
    bookConfig.chapterLabelColor.trim() || contrastHex(chapterBackdrop);
  const spineMarkColor =
    bookConfig.spineMarkColor.trim() || contrastHex(coverColor);
  const chapterTitle = showsChapterTitle(bookConfig) ? chapter.label : "";
  const coverSide = bookConfig.coverSide ?? "rtl";
  const guidesOn = showLines && !singlePage;

  useEffect(() => {
    if (!image || configRef.current.chapterLabelColor.trim()) return;
    onBookConfigChange({
      ...configRef.current,
      chapterLabelColor: contrastHex(chapterBackdrop),
    });
  }, [image, chapterBackdrop, onBookConfigChange]);

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

    const guides = guidesOn
      ? coverGuidesCm(
          layoutCoverCm(chapter.pages, coverSide, pagesPerSpineCm, pageSize, {
            widthCm: stripeLayout.widthCm,
            insetCm: stripeLayout.insetCm,
            edgeGapCm: stripeLayout.edgeGapCm,
          }),
        )
      : [];

    const fitCanvas = () => {
      const widthPx = Math.round(cmToPx(boardWidth, PREVIEW_DPI));
      const heightPx = Math.round(cmToPx(boardHeight, PREVIEW_DPI));
      const { width, height } = container.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      const scale = Math.min(width / widthPx, height / heightPx);
      const cssWidth = `${widthPx * scale}px`;
      const cssHeight = `${heightPx * scale}px`;
      canvas.style.width = cssWidth;
      canvas.style.height = cssHeight;
      overlay.style.width = cssWidth;
      overlay.style.height = cssHeight;
      if (guides.length > 0) {
        drawGuides(overlay, guides, boardWidth, boardHeight);
      } else {
        overlay
          .getContext("2d")
          ?.clearRect(0, 0, overlay.width, overlay.height);
      }
    };

    const frame = requestAnimationFrame(() => {
      drawCoverOnCanvas(canvas, {
        sourceImage: image,
        pages: chapter.pages,
        label: chapterTitle,
        bookName: bookConfig.bookName ?? "",
        coverSide,
        coverKind: bookConfig.coverKind ?? "wrap",
        dpi: PREVIEW_DPI,
        coverColor,
        stripeColor,
        stripeForeground,
        chapterLabelColor,
        chapterLabelX,
        chapterLabelY,
        chapterLabelSizeCm,
        stripeText: bookConfig.bookDescription,
        spineMarkColor,
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
      });
      fitCanvas();
    });

    const resizeObserver = new ResizeObserver(fitCanvas);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [
    image,
    chapter.pages,
    chapterTitle,
    chapter.index,
    hasChapters,
    coverSide,
    bookConfig.coverKind,
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
    spineMarkColor,
    guidesOn,
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
  ]);

  const canExport =
    Boolean(sourceImage) && !exporting && allocationError === null;

  return (
    <section
      className="flex min-h-0 flex-col gap-3 p-4 lg:h-full"
      aria-label="معاينة الغلاف"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {hasChapters ? (
            chapters.map((item, index) => (
              <Button
                key={`${item.label}-${index}`}
                size="sm"
                variant={index === chapterIndex ? "default" : "outline"}
                className="h-7 px-2.5 text-xs"
                onClick={() => onChapterIndexChange(index)}
              >
                {item.label || `غلاف ${item.index}`}
              </Button>
            ))
          ) : (
            <span className="text-muted-foreground text-xs">
              غلاف واحد · {chapter.pages} صفحة
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!singlePage && (
            <div className="flex items-center gap-2">
              <Switch
                id="fold-guides"
                checked={showLines}
                onCheckedChange={onShowLinesChange}
              />
              <Label htmlFor="fold-guides" className="text-xs font-medium">
                الأدلة
              </Label>
            </div>
          )}
          <Button
            size="sm"
            disabled={!canExport}
            onClick={onExport}
            className="gap-1.5"
            title="يحفظ صورة الغلاف وملف PDF لكل فصل باسم الكتاب"
          >
            {exporting ? (
              <Spinner />
            ) : (
              <HugeiconsIcon icon={Download01Icon} className="size-3.5" />
            )}
            تصدير
            {chapters.length > 1 && (
              <span className="opacity-70">({chapters.length})</span>
            )}
          </Button>
        </div>
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
            ارفع صورة الغلاف أو ملف PDF لتظهر المعاينة هنا.
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
            ? `صفحة ${pageSize.toUpperCase()} واحدة (${pageDims.width}×${pageDims.height} سم). ملف PDF لكل فصل: ${chapters.length}.`
            : `اللوحة ${ARTBOARD_WIDTH_CM}×${ARTBOARD_HEIGHT_CM} سم · الغلاف ${pageSize.toUpperCase()} ${pageDims.width}×${pageDims.height} سم · الكعب ${spineCm.toFixed(2)} سم من ${chapter.pages} صفحة · الشريط ${stripeLayout.widthCm} سم · العرض الكلي ${wrapCm.toFixed(2)} سم.`}
        </p>
      )}
    </section>
  );
}
