import { useMemo, useRef } from "react";
import {
  ArrowLeftRightIcon,
  ArrowUpDownIcon,
  TextFontIcon,
  TextIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Checkbox } from "@/components/ui/checkbox";
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

import { useModels } from "../context";
import {
  COVER_FONT_CATEGORIES,
  COVER_FONT_PAIRS,
  getCoverFontPair,
  type CoverFontPair,
} from "../lib/cover-fonts";
import {
  clampChapterLabelSize,
  contrastHex,
  DEFAULT_COVER_COLOR,
  isSinglePageCover,
  MAX_CHAPTER_LABEL_SIZE_CM,
  MIN_CHAPTER_LABEL_SIZE_CM,
  MIN_SPINE_CM,
  pageDimsCm,
  resolveChapters,
  sampleChapterBackdrop,
  shiftHex,
  spineHiddenFor,
} from "../lib/cover-layout";
import type { BookConfig } from "../types";
import { ChapterLabelField } from "./chapter-label-field";
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
  const { pagesPerSpineCm } = useModels();
  const configRef = useRef(bookConfig);
  configRef.current = bookConfig;
  const chapters = useMemo(() => resolveChapters(bookConfig), [bookConfig]);
  const hasChapters = chapters.length > 1;
  // A spine thinner than the minimum is dropped unless forced; its controls
  // only matter while some chapter still prints one.
  const thinSpine = chapters.some((chapter) =>
    spineHiddenFor(chapter.pages, pagesPerSpineCm, false),
  );
  const spineShown = chapters.some(
    (chapter) =>
      !spineHiddenFor(chapter.pages, pagesPerSpineCm, bookConfig.forceSpine),
  );
  const fontCategory = bookConfig.language === "en" ? "english" : "arabic";
  const fontOptions = COVER_FONT_PAIRS.filter(
    (pair) => pair.category === fontCategory,
  );
  const fontPair = fontOptions.some((pair) => pair.id === bookConfig.fontPair)
    ? getCoverFontPair(bookConfig.fontPair)
    : (fontOptions[0] ?? getCoverFontPair(bookConfig.fontPair));
  const pageDims = pageDimsCm(bookConfig.pageSize ?? "a4");
  const singlePage = isSinglePageCover(bookConfig);
  const coverColor = bookConfig.coverColor || DEFAULT_COVER_COLOR;
  const stripeColor = bookConfig.stripeColor || shiftHex(coverColor, -18);
  const chapterLabelX = bookConfig.chapterLabelX ?? 50;
  const chapterLabelY = bookConfig.chapterLabelY ?? 88;
  const chapterLabelSize = clampChapterLabelSize(bookConfig.chapterLabelSizeCm);
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
      <Select
        value={fontPair.id}
        disabled={disabled}
        onValueChange={(value) => patch({ fontPair: value as CoverFontPair })}
      >
        <SelectTrigger className="w-full" size="sm" aria-label="الخط">
          <HugeiconsIcon
            icon={TextFontIcon}
            className="text-muted-foreground size-3.5 shrink-0"
            strokeWidth={2}
          />
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
          </>
        )}
        {!singlePage && spineShown && (
          <>
            <CoverColorPicker
              label="لون نص الكعب"
              value={bookConfig.spineTextColor}
              fallback={contrastHex(coverColor)}
              onChange={(hex) => patch({ spineTextColor: hex })}
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
            value={
              bookConfig.chapterLabelContrast !== false
                ? ""
                : bookConfig.chapterLabelColor
            }
            fallback={contrastHex(chapterBackdrop)}
            onChange={(hex) =>
              patch({ chapterLabelColor: hex, chapterLabelContrast: false })
            }
            disabled={disabled}
            swatches={palette}
            special={{
              hex: contrastHex(chapterBackdrop),
              backdrop: chapterBackdrop,
              label: "لون متباين مع ما تحت التسمية",
              active: bookConfig.chapterLabelContrast !== false,
            }}
            onSelectSpecial={() => patch({ chapterLabelContrast: true })}
          />
        )}
      </div>

      {!singlePage && thinSpine && (
        <label className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs">
          <Checkbox
            checked={bookConfig.forceSpine === true}
            disabled={disabled}
            onCheckedChange={(checked) =>
              patch({ forceSpine: checked === true })
            }
          />
          <span>إظهار الكعب رغم أنه أقل من {MIN_SPINE_CM} سم</span>
        </label>
      )}

      {hasChapters && (
        <div className="flex flex-col gap-3 rounded-md border p-3">
          <ChapterLabelField
            bookConfig={bookConfig}
            disabled={disabled}
            onBookConfigChange={onBookConfigChange}
          />
          <label className="flex items-center gap-2 text-xs">
            <Checkbox
              checked={bookConfig.chapterLabelShadow !== false}
              disabled={disabled}
              onCheckedChange={(checked) =>
                patch({ chapterLabelShadow: checked === true })
              }
            />
            <span>ظل تحت التسمية</span>
          </label>
          <IconSlider
            icon={TextIcon}
            label="حجم تسمية الفصل"
            value={chapterLabelSize}
            min={MIN_CHAPTER_LABEL_SIZE_CM}
            max={MAX_CHAPTER_LABEL_SIZE_CM}
            step={0.05}
            display={`${chapterLabelSize.toFixed(2)} cm`}
            disabled={disabled}
            onChange={(value) => patch({ chapterLabelSizeCm: value })}
          />
          <IconSlider
            icon={ArrowLeftRightIcon}
            label="موضع تسمية الفصل أفقيًا"
            value={chapterLabelX}
            min={0}
            max={100}
            step={1}
            display={`${((chapterLabelX / 100) * pageDims.width).toFixed(1)} cm`}
            disabled={disabled}
            onChange={(value) => patch({ chapterLabelX: value })}
          />
          <IconSlider
            icon={ArrowUpDownIcon}
            label="موضع تسمية الفصل عموديًا"
            value={chapterLabelY}
            min={0}
            max={100}
            step={1}
            display={`${((chapterLabelY / 100) * pageDims.height).toFixed(1)} cm`}
            disabled={disabled}
            onChange={(value) => patch({ chapterLabelY: value })}
          />
        </div>
      )}
    </div>
  );
}

function IconSlider({
  icon,
  label,
  value,
  min,
  max,
  step,
  display,
  disabled,
  onChange,
}: {
  icon: typeof TextIcon;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <HugeiconsIcon
        icon={icon}
        className="text-muted-foreground size-4 shrink-0"
        strokeWidth={2}
        aria-hidden
      />
      <Slider
        dir="ltr"
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        value={[value]}
        onValueChange={([next]) => onChange(next)}
        aria-label={label}
        title={label}
        className="flex-1"
      />
      <span
        className="text-muted-foreground w-16 shrink-0 text-end font-mono text-[11px] tabular-nums"
        dir="ltr"
      >
        {display}
      </span>
    </div>
  );
}
