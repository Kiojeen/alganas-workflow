import { useEffect, useMemo, useRef, useState } from "react";

import { Download01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

import {
  COVER_FONT_CATEGORIES,
  COVER_FONT_PAIRS,
  ensureCoverFonts,
  getCoverFontPair,
  type CoverFontPair,
} from "../lib/cover-fonts";
import { useModels } from "../context";
import type { BookConfig, CoverPageSize, CoverSide } from "../types";
import {
  ARTBOARD_HEIGHT_CM,
  ARTBOARD_WIDTH_CM,
  DEFAULT_COVER_COLOR,
  PREVIEW_DPI,
  cmToPx,
  contrastHex,
  drawCoverOnCanvas,
  extractPalette,
  readableOn,
  sampleChapterBackdrop,
  loadCoverImage,
  pageDimsCm,
  resolveChapters,
  shiftHex,
  spineWidthCm,
  wrapWidthCm,
} from "../lib/cover-layout";
import { showsChapterTitle, unassignedPagesError } from "../lib/chapter-division";
import { CoverColorPicker } from "./cover-color-picker";

export function ConvertStep({
  disabled,
  sourceImage,
  awaitingGeneratedCover,
  bookConfig,
  onBookConfigChange,
  showLines,
  setShowLines,
  onExport,
  exporting,
}: {
  disabled: boolean;
  sourceImage: string | null;
  awaitingGeneratedCover?: boolean;
  bookConfig: BookConfig;
  onBookConfigChange: (config: BookConfig) => void;
  showLines: boolean;
  setShowLines: (v: boolean) => void;
  onExport: () => void;
  exporting: boolean;
}) {
  const { pagesPerSpineCm, stripeA4, stripeA5 } = useModels();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const configRef = useRef(bookConfig);
  configRef.current = bookConfig;
  const chapters = useMemo(() => resolveChapters(bookConfig), [bookConfig]);
  const allocationError = unassignedPagesError(bookConfig);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [palette, setPalette] = useState<string[]>([]);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const fontPair = getCoverFontPair(bookConfig.fontPair);
  const chapter = chapters[Math.min(chapterIndex, chapters.length - 1)];
  const hasChapters = chapters.length > 1;
  const pageSize = bookConfig.pageSize ?? "a4";
  const pageDims = pageDimsCm(pageSize);
  const stripeLayout = pageSize === "a5" ? stripeA5 : stripeA4;
  const spineCm = spineWidthCm(chapter.pages, pagesPerSpineCm);
  const wrapCm = wrapWidthCm(chapter.pages, pagesPerSpineCm, pageDims.width);
  const coverColor = bookConfig.coverColor || DEFAULT_COVER_COLOR;
  const stripeColor = bookConfig.stripeColor || shiftHex(coverColor, -18);
  const stripeForeground = readableOn(
    bookConfig.stripeForeground,
    stripeColor,
  );
  const chapterLabelX = bookConfig.chapterLabelX ?? 50;
  const chapterLabelY = bookConfig.chapterLabelY ?? 88;
  const chapterBackdrop = sampleChapterBackdrop(
    loadedImage,
    pageDims.width,
    pageDims.height,
    chapterLabelX,
    chapterLabelY,
  );
  const chapterLabelColor = readableOn(
    bookConfig.chapterLabelColor,
    chapterBackdrop,
  );
  const spineMarkColor = readableOn(bookConfig.spineMarkColor, coverColor);
  const chapterTitle = showsChapterTitle(bookConfig) ? chapter.label : "";

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
    setChapterIndex(0);
  }, [
    chapters.length,
    bookConfig.division,
    bookConfig.numPages,
    bookConfig.maxPagesPerChapter,
    bookConfig.chapterCount,
    bookConfig.chapterPages.join(","),
    (bookConfig.chapterNames ?? []).join("\u0000"),
    bookConfig.chapterLabel,
  ]);

  useEffect(() => {
    let cancelled = false;
    if (!sourceImage) {
      setPalette([]);
      setLoadedImage(null);
      return;
    }

    const load = async () => {
      try {
        const image = await loadCoverImage(sourceImage);
        if (cancelled) return;
        setLoadedImage(image);
        const colors = extractPalette(image);
        setPalette(colors);
        if (!configRef.current.coverColor && colors[0]) {
          onBookConfigChange({
            ...configRef.current,
            coverColor: colors[0],
          });
        }
      } catch {
        if (!cancelled) {
          setPalette([]);
          setLoadedImage(null);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [sourceImage, onBookConfigChange]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const fitCanvas = () => {
      const widthPx = Math.round(cmToPx(ARTBOARD_WIDTH_CM, PREVIEW_DPI));
      const heightPx = Math.round(cmToPx(ARTBOARD_HEIGHT_CM, PREVIEW_DPI));
      const { width, height } = container.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      const scale = Math.min(width / widthPx, height / heightPx);
      canvas.style.width = `${widthPx * scale}px`;
      canvas.style.height = `${heightPx * scale}px`;
    };

    const frame = requestAnimationFrame(() => {
      drawCoverOnCanvas(canvas, {
        sourceImage: loadedImage,
        pages: chapter.pages,
        label: chapterTitle,
        bookName: bookConfig.bookName ?? "",
        coverSide: bookConfig.coverSide ?? "rtl",
        showGuides: showLines,
        dpi: PREVIEW_DPI,
        coverColor,
        stripeColor,
        stripeForeground,
        chapterLabelColor,
        chapterLabelX,
        chapterLabelY,
        stripeText: bookConfig.bookDescription,
        spineMarkColor,
        titleFont: fontPair.titleFamily,
        descriptionFont: fontPair.descriptionFamily,
        labelFont: fontPair.labelFamily,
        titleWeight: fontPair.titleWeight,
        descriptionWeight: fontPair.descriptionWeight,
        labelWeight: fontPair.labelWeight,
        chapterNumber: hasChapters ? String(chapter.index) : undefined,
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
    loadedImage,
    chapter.pages,
    chapterTitle,
    chapter.index,
    hasChapters,
    bookConfig.coverSide,
    bookConfig.bookName,
    bookConfig.bookDescription,
    coverColor,
    stripeColor,
    stripeForeground,
    chapterLabelColor,
    chapterLabelX,
    chapterLabelY,
    spineMarkColor,
    showLines,
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

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-muted-foreground text-xs font-medium">
            موضع الغلاف الأمامي
          </Label>
          <Select
            value={bookConfig.coverSide}
            disabled={disabled}
            onValueChange={(value) =>
              onBookConfigChange({
                ...configRef.current,
                coverSide: value as CoverSide,
              })
            }
          >
            <SelectTrigger className="w-full" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rtl">RTL — الغلاف يسار</SelectItem>
              <SelectItem value="ltr">LTR — الغلاف يمين</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-muted-foreground text-xs font-medium">
            الخط
          </Label>
          <Select
            value={fontPair.id}
            disabled={disabled}
            onValueChange={(value) =>
              onBookConfigChange({
                ...configRef.current,
                fontPair: value as CoverFontPair,
              })
            }
          >
            <SelectTrigger className="w-full" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COVER_FONT_CATEGORIES.map((category) => (
                <SelectGroup key={category.id}>
                  <SelectLabel>{category.label}</SelectLabel>
                  {COVER_FONT_PAIRS.filter(
                    (pair) => pair.category === category.id,
                  ).map((pair) => (
                    <SelectItem key={pair.id} value={pair.id}>
                      {pair.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-muted-foreground text-xs font-medium">
            حجم الغلاف
          </Label>
          <Select
            value={pageSize}
            disabled={disabled}
            onValueChange={(value) =>
              onBookConfigChange({
                ...configRef.current,
                pageSize: value as CoverPageSize,
              })
            }
          >
            <SelectTrigger className="w-full" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a4">A4 — 21×29.7 سم</SelectItem>
              <SelectItem value="a5">A5 — 14.8×21 سم</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {allocationError && (
        <p className="text-destructive text-xs font-medium" role="alert">
          {allocationError}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Switch
            id="fold-guides"
            checked={showLines}
            disabled={disabled}
            onCheckedChange={setShowLines}
          />
          <Label htmlFor="fold-guides" className="text-xs font-medium">
            إظهار خطوط الطي
          </Label>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled || !sourceImage || exporting || allocationError !== null}
          onClick={onExport}
          className="gap-1"
        >
          <HugeiconsIcon icon={Download01Icon} className="size-3.5" />
          تصدير PDF
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CoverColorPicker
          label="لون الغلاف"
          value={coverColor}
          fallback={DEFAULT_COVER_COLOR}
          onChange={(hex) =>
            onBookConfigChange({ ...configRef.current, coverColor: hex })
          }
          disabled={disabled}
          swatches={palette}
        />
        <CoverColorPicker
          label="لون الشريط"
          value={stripeColor}
          fallback={shiftHex(coverColor, -18)}
          onChange={(hex) =>
            onBookConfigChange({ ...configRef.current, stripeColor: hex })
          }
          disabled={disabled}
          swatches={palette}
        />
        <CoverColorPicker
          label="لون نص الشريط"
          value={stripeForeground}
          fallback={contrastHex(stripeColor)}
          onChange={(hex) =>
            onBookConfigChange({
              ...configRef.current,
              stripeForeground: hex,
            })
          }
          disabled={disabled}
          swatches={palette}
        />
        <CoverColorPicker
          label="لون علامات الكعب"
          value={spineMarkColor}
          fallback={contrastHex(coverColor)}
          onChange={(hex) =>
            onBookConfigChange({ ...configRef.current, spineMarkColor: hex })
          }
          disabled={disabled}
          swatches={palette}
        />
      </div>

      {hasChapters ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <CoverColorPicker
            label="لون تسمية الفصل"
            value={chapterLabelColor}
            fallback={contrastHex(chapterBackdrop)}
            onChange={(hex) =>
              onBookConfigChange({
                ...configRef.current,
                chapterLabelColor: hex,
              })
            }
            disabled={disabled}
            swatches={palette}
          />
          <div className="flex flex-col gap-3">
            <Label className="text-muted-foreground text-xs font-medium">
              موضع تسمية الفصل
            </Label>
            <div className="flex flex-col gap-1">
              <div className="text-muted-foreground flex items-center justify-between text-[10px]">
                <div className="flex justify-between gap-3" dir="ltr">
                  <span>يسار</span>
                  <span>يمين</span>
                </div>
                <span className="font-mono text-xs text-foreground" dir="ltr">
                  {((chapterLabelX / 100) * pageDims.width).toFixed(1)} cm
                </span>
              </div>
              <Slider
                dir="ltr"
                min={0}
                max={100}
                step={1}
                disabled={disabled}
                value={[chapterLabelX]}
                onValueChange={([value]) =>
                  onBookConfigChange({
                    ...configRef.current,
                    chapterLabelX: value,
                  })
                }
                aria-label="يسار ويمين"
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-muted-foreground flex items-center justify-between text-[10px]">
                <div className="flex justify-between gap-3" dir="ltr">
                  <span>أعلى</span>
                  <span>أسفل</span>
                </div>
                <span className="font-mono text-xs text-foreground" dir="ltr">
                  {((chapterLabelY / 100) * pageDims.height).toFixed(1)} cm
                </span>
              </div>
              <Slider
                dir="ltr"
                min={0}
                max={100}
                step={1}
                disabled={disabled}
                value={[chapterLabelY]}
                onValueChange={([value]) =>
                  onBookConfigChange({
                    ...configRef.current,
                    chapterLabelY: value,
                  })
                }
                aria-label="أعلى وأسفل"
              />
            </div>
          </div>
        </div>
      ) : null}

      <p className="text-muted-foreground text-xs leading-relaxed">
        اللوحة ثابتة {ARTBOARD_WIDTH_CM}×{ARTBOARD_HEIGHT_CM} سم. الغلاف{" "}
        {pageSize.toUpperCase()} ({pageDims.width}×{pageDims.height} سم) ملاصق
        للكعب، والكعب {spineCm.toFixed(2)} سم من {chapter.pages} صفحة. الوجه
        الآخر شريط بعرض {stripeLayout.widthCm} سم. العرض الكلي {wrapCm.toFixed(2)}{" "}
        سم.
      </p>

      {awaitingGeneratedCover && (
        <p className="text-muted-foreground rounded-md border border-dashed px-3 py-2 text-xs">
          الغلاف الأصلي مخفي هنا لأن توليد الصورة مفعّل. سيظهر الغلاف بعد تشغيل
          خطوة الذكاء الاصطناعي.
        </p>
      )}

      {chapters.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {chapters.map((item, index) => (
            <Button
              key={`${item.label}-${index}`}
              size="sm"
              variant={index === chapterIndex ? "default" : "outline"}
              disabled={disabled}
              onClick={() => setChapterIndex(index)}
            >
              {item.label || `غلاف ${item.index}`}
            </Button>
          ))}
        </div>
      )}

      <div
        ref={containerRef}
        className="flex min-h-48 w-full items-center justify-center overflow-hidden rounded-md border"
        style={{
          aspectRatio: `${ARTBOARD_WIDTH_CM} / ${ARTBOARD_HEIGHT_CM}`,
          backgroundColor: coverColor,
        }}
      >
        <canvas ref={canvasRef} className="block max-h-full max-w-full" />
      </div>
    </div>
  );
}
