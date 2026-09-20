import { useEffect, useMemo, useRef, useState } from "react";

import { Download01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import type { BookConfig, CoverSide } from "../types";
import {
  A4_HEIGHT_CM,
  A4_WIDTH_CM,
  ARTBOARD_HEIGHT_CM,
  ARTBOARD_WIDTH_CM,
  BACK_STRIPE_WIDTH_CM,
  DEFAULT_CHAPTER_LABEL_COLOR,
  DEFAULT_COVER_COLOR,
  DEFAULT_STRIPE_FOREGROUND,
  PREVIEW_DPI,
  cmToPx,
  contrastHex,
  drawCoverOnCanvas,
  extractPalette,
  loadCoverImage,
  resolveChapters,
  spineWidthCm,
  wrapWidthCm,
} from "../lib/cover-layout";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const configRef = useRef(bookConfig);
  configRef.current = bookConfig;
  const chapters = useMemo(() => resolveChapters(bookConfig), [bookConfig]);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [palette, setPalette] = useState<string[]>([]);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const chapter = chapters[Math.min(chapterIndex, chapters.length - 1)];
  const spineCm = spineWidthCm(chapter.pages);
  const wrapCm = wrapWidthCm(chapter.pages);
  const coverColor = bookConfig.coverColor || DEFAULT_COVER_COLOR;
  const stripeForeground =
    bookConfig.stripeForeground || DEFAULT_STRIPE_FOREGROUND;
  const chapterLabelColor =
    bookConfig.chapterLabelColor || DEFAULT_CHAPTER_LABEL_COLOR;
  const chapterLabelX = bookConfig.chapterLabelX ?? 50;
  const chapterLabelY = bookConfig.chapterLabelY ?? 88;
  const spineMarkColor =
    bookConfig.spineMarkColor || contrastHex(coverColor);

  useEffect(() => {
    setChapterIndex(0);
  }, [
    chapters.length,
    bookConfig.multiChapter,
    bookConfig.numPages,
    bookConfig.maxPagesPerChapter,
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
        label: chapter.label,
        bookName: bookConfig.bookName ?? "",
        coverSide: bookConfig.coverSide ?? "rtl",
        showGuides: showLines,
        dpi: PREVIEW_DPI,
        coverColor,
        stripeForeground,
        chapterLabelColor,
        chapterLabelX,
        chapterLabelY,
        stripeText: bookConfig.bookDescription,
        spineMarkColor,
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
    chapter.label,
    bookConfig.coverSide,
    bookConfig.bookName,
    bookConfig.bookDescription,
    coverColor,
    stripeForeground,
    chapterLabelColor,
    chapterLabelX,
    chapterLabelY,
    spineMarkColor,
    showLines,
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-muted-foreground text-xs font-medium">
            موضع الغلاف الأمامي
          </Label>
          <ToggleGroup
            type="single"
            value={bookConfig.coverSide}
            disabled={disabled}
            onValueChange={(value) => {
              if (!value) return;
              onBookConfigChange({
                ...configRef.current,
                coverSide: value as CoverSide,
              });
            }}
            variant="outline"
            size="sm"
            spacing={0}
            className="w-full"
          >
            <ToggleGroupItem
              value="rtl"
              className="flex-1 whitespace-normal text-xs"
            >
              RTL — الغلاف يسار
            </ToggleGroupItem>
            <ToggleGroupItem
              value="ltr"
              className="flex-1 whitespace-normal text-xs"
            >
              LTR — الغلاف يمين
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="flex items-center gap-2 pb-1">
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
            disabled={disabled || !sourceImage || exporting}
            onClick={onExport}
            className="gap-1"
          >
            <HugeiconsIcon icon={Download01Icon} className="size-3.5" />
            تصدير PDF
          </Button>
        </div>
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
          label="لون نص الشريط"
          value={stripeForeground}
          fallback={DEFAULT_STRIPE_FOREGROUND}
          onChange={(hex) =>
            onBookConfigChange({ ...configRef.current, stripeForeground: hex })
          }
          disabled={disabled}
          swatches={palette}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CoverColorPicker
          label="لون تسمية الفصل"
          value={chapterLabelColor}
          fallback={DEFAULT_CHAPTER_LABEL_COLOR}
          onChange={(hex) =>
            onBookConfigChange({
              ...configRef.current,
              chapterLabelColor: hex,
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
                {((chapterLabelX / 100) * A4_WIDTH_CM).toFixed(1)} cm
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
                {((chapterLabelY / 100) * A4_HEIGHT_CM).toFixed(1)} cm
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

      <p className="text-muted-foreground text-xs leading-relaxed">
        اللوحة ثابتة {ARTBOARD_WIDTH_CM}×{ARTBOARD_HEIGHT_CM} سم. الغلاف بحجم A4
        (21×29.7 سم) ملاصق للكعب، والكعب {spineCm.toFixed(2)} سم من{" "}
        {chapter.pages} صفحة. الوجه الآخر شريط بعرض {BACK_STRIPE_WIDTH_CM} سم.
        العرض الكلي {wrapCm.toFixed(2)} سم.
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
        className="bg-muted/40 flex min-h-48 w-full items-center justify-center overflow-hidden rounded-md border"
        style={{ aspectRatio: `${ARTBOARD_WIDTH_CM} / ${ARTBOARD_HEIGHT_CM}` }}
      >
        <canvas ref={canvasRef} className="block max-h-full max-w-full" />
      </div>
    </div>
  );
}
