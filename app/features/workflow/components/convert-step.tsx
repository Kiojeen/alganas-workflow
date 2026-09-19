import { useEffect, useMemo, useRef, useState } from "react";

import { Download01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import type { BookConfig, CoverSide } from "../types";
import {
  ARTBOARD_HEIGHT_CM,
  ARTBOARD_WIDTH_CM,
  PREVIEW_DPI,
  cmToPx,
  drawCoverOnCanvas,
  loadCoverImage,
  resolveChapters,
  spineWidthCm,
  wrapWidthCm,
} from "../lib/cover-layout";

export function ConvertStep({
  disabled,
  sourceImage,
  bookConfig,
  onBookConfigChange,
  showLines,
  setShowLines,
  onExport,
  exporting,
}: {
  disabled: boolean;
  sourceImage: string | null;
  bookConfig: BookConfig;
  onBookConfigChange: (config: BookConfig) => void;
  showLines: boolean;
  setShowLines: (v: boolean) => void;
  onExport: () => void;
  exporting: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chapters = useMemo(() => resolveChapters(bookConfig), [bookConfig]);
  const [chapterIndex, setChapterIndex] = useState(0);
  const chapter = chapters[Math.min(chapterIndex, chapters.length - 1)];
  const spineCm = spineWidthCm(chapter.pages);
  const wrapCm = wrapWidthCm(chapter.pages);

  useEffect(() => {
    setChapterIndex(0);
  }, [chapters.length, bookConfig.autoChapter, bookConfig.numPages]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    const fitCanvas = () => {
      const widthPx = Math.round(cmToPx(ARTBOARD_WIDTH_CM, PREVIEW_DPI));
      const heightPx = Math.round(cmToPx(ARTBOARD_HEIGHT_CM, PREVIEW_DPI));
      const { width, height } = container.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      const scale = Math.min(width / widthPx, height / heightPx);
      canvas.style.width = `${widthPx * scale}px`;
      canvas.style.height = `${heightPx * scale}px`;
    };

    const render = async () => {
      let image: HTMLImageElement | null = null;
      if (sourceImage) {
        try {
          image = await loadCoverImage(sourceImage);
        } catch {
          image = null;
        }
      }
      if (cancelled || !canvasRef.current) return;
      drawCoverOnCanvas(canvasRef.current, {
        sourceImage: image,
        pages: chapter.pages,
        label: chapter.label,
        coverSide: bookConfig.coverSide ?? "rtl",
        showGuides: showLines,
        dpi: PREVIEW_DPI,
      });
      fitCanvas();
    };

    void render();
    resizeObserver = new ResizeObserver(fitCanvas);
    resizeObserver.observe(container);

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, [
    sourceImage,
    chapter.pages,
    chapter.label,
    bookConfig.coverSide,
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
                ...bookConfig,
                coverSide: value as CoverSide,
              });
            }}
            variant="outline"
            size="sm"
            spacing={0}
            className="w-full"
          >
            <ToggleGroupItem value="rtl" className="flex-1 whitespace-normal text-xs">
              RTL — الغلاف يسار
            </ToggleGroupItem>
            <ToggleGroupItem value="ltr" className="flex-1 whitespace-normal text-xs">
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

      <p className="text-muted-foreground text-xs leading-relaxed">
        اللوحة ثابتة {ARTBOARD_WIDTH_CM}×{ARTBOARD_HEIGHT_CM} سم. الغلاف بحجم A4
        (21×29.7 سم) ملاصق للكعب، والكعب {spineCm.toFixed(2)} سم من{" "}
        {chapter.pages} صفحة (عدد الصفحات ÷ 200). العرض الكلي للغلاف{" "}
        {wrapCm.toFixed(2)} سم، والفراغ على الأطراف مسموح.
      </p>

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
              {item.label}
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
