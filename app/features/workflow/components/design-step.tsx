import { useMemo, useRef } from "react";

import { cn } from "@/lib/utils";
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

import {
  COVER_FONT_CATEGORIES,
  COVER_FONT_PAIRS,
  getCoverFontPair,
  type CoverFontPair,
} from "../lib/cover-fonts";
import type { BookConfig, CoverPageSize } from "../types";
import {
  DEFAULT_COVER_COLOR,
  contrastHex,
  isSinglePageCover,
  pageDimsCm,
  resolveChapters,
  sampleChapterBackdrop,
  shiftHex,
} from "../lib/cover-layout";
import { CoverColorPicker } from "./cover-color-picker";

export function DesignStep({
  disabled,
  image,
  palette,
  bookConfig,
  onBookConfigChange,
}: {
  disabled: boolean;
  image: HTMLImageElement | null;
  palette: string[];
  bookConfig: BookConfig;
  onBookConfigChange: (config: BookConfig) => void;
}) {
  const configRef = useRef(bookConfig);
  configRef.current = bookConfig;
  const chapters = useMemo(() => resolveChapters(bookConfig), [bookConfig]);
  const hasChapters = chapters.length > 1;
  const fontCategory =
    bookConfig.language === "en" ? "english" : "arabic";
  const fontOptions = COVER_FONT_PAIRS.filter(
    (pair) => pair.category === fontCategory,
  );
  const fontPair = fontOptions.some((pair) => pair.id === bookConfig.fontPair)
    ? getCoverFontPair(bookConfig.fontPair)
    : (fontOptions[0] ?? getCoverFontPair(bookConfig.fontPair));
  const pageSize = bookConfig.pageSize ?? "a4";
  const pageDims = pageDimsCm(pageSize);
  const singlePage = isSinglePageCover(bookConfig);
  const coverColor = bookConfig.coverColor || DEFAULT_COVER_COLOR;
  const stripeColor = bookConfig.stripeColor || shiftHex(coverColor, -18);
  const chapterLabelX = bookConfig.chapterLabelX ?? 50;
  const chapterLabelY = bookConfig.chapterLabelY ?? 88;
  const chapterBackdrop = sampleChapterBackdrop(
    image,
    pageDims.width,
    pageDims.height,
    chapterLabelX,
    chapterLabelY,
  );

  const patch = (change: Partial<BookConfig>) =>
    onBookConfigChange({ ...configRef.current, ...change });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="حجم الغلاف">
          <Select
            value={pageSize}
            disabled={disabled}
            onValueChange={(value) =>
              patch({ pageSize: value as CoverPageSize })
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
        </Field>

        <Field label="الخط">
          <Select
            value={fontPair.id}
            disabled={disabled}
            onValueChange={(value) =>
              patch({ fontPair: value as CoverFontPair })
            }
          >
            <SelectTrigger className="w-full" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COVER_FONT_CATEGORIES.filter(
                (category) => category.id === fontCategory,
              ).map((category) => (
                <SelectGroup key={category.id}>
                  <SelectLabel>{category.label}</SelectLabel>
                  {fontOptions.map((pair) => (
                    <SelectItem key={pair.id} value={pair.id}>
                      {pair.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CoverColorPicker
          label="لون الغلاف"
          value={coverColor}
          fallback={DEFAULT_COVER_COLOR}
          onChange={(hex) => patch({ coverColor: hex })}
          disabled={disabled}
          swatches={palette}
        />
        {!singlePage && (
          <>
            <CoverColorPicker
              label="لون الشريط"
              value={stripeColor}
              fallback={shiftHex(coverColor, -18)}
              onChange={(hex) => patch({ stripeColor: hex })}
              disabled={disabled}
              swatches={palette}
            />
            <CoverColorPicker
              label="لون نص الشريط"
              value={bookConfig.stripeForeground}
              fallback={contrastHex(stripeColor)}
              onChange={(hex) => patch({ stripeForeground: hex })}
              disabled={disabled}
              swatches={palette}
            />
            <CoverColorPicker
              label="لون علامات الكعب"
              value={bookConfig.spineMarkColor}
              fallback={contrastHex(coverColor)}
              onChange={(hex) => patch({ spineMarkColor: hex })}
              disabled={disabled}
              swatches={palette}
            />
          </>
        )}
        {hasChapters && (
          <CoverColorPicker
            label="لون تسمية الفصل"
            value={bookConfig.chapterLabelColor}
            fallback={contrastHex(chapterBackdrop)}
            onChange={(hex) => patch({ chapterLabelColor: hex })}
            disabled={disabled}
            swatches={palette}
          />
        )}
      </div>

      {hasChapters && (
        <div className="flex flex-col gap-3">
          <Label className="text-muted-foreground text-xs font-medium">
            موضع تسمية الفصل
          </Label>
          <PositionSlider
            startLabel="يسار"
            endLabel="يمين"
            value={chapterLabelX}
            cm={(chapterLabelX / 100) * pageDims.width}
            disabled={disabled}
            onChange={(value) => patch({ chapterLabelX: value })}
            ariaLabel="يسار ويمين"
          />
          <PositionSlider
            startLabel="أعلى"
            endLabel="أسفل"
            value={chapterLabelY}
            cm={(chapterLabelY / 100) * pageDims.height}
            disabled={disabled}
            onChange={(value) => patch({ chapterLabelY: value })}
            ariaLabel="أعلى وأسفل"
          />
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-muted-foreground text-xs font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

function PositionSlider({
  startLabel,
  endLabel,
  value,
  cm,
  disabled,
  onChange,
  ariaLabel,
}: {
  startLabel: string;
  endLabel: string;
  value: number;
  cm: number;
  disabled: boolean;
  onChange: (value: number) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-muted-foreground flex items-center justify-between text-[10px]">
        <div className="flex justify-between gap-3" dir="ltr">
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </div>
        <span className="text-foreground font-mono text-xs" dir="ltr">
          {cm.toFixed(1)} cm
        </span>
      </div>
      <Slider
        dir="ltr"
        min={0}
        max={100}
        step={1}
        disabled={disabled}
        value={[value]}
        onValueChange={([next]) => onChange(next)}
        aria-label={ariaLabel}
      />
    </div>
  );
}
