import { useLayoutEffect, useRef, useState } from "react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useModels } from "../context";
import {
  chapterNameInput,
  isCustomChapterName,
  pageCap,
  remainingPages,
  resetChapterName,
  resetChapterPages,
  setChapterCount,
  setChapterName,
  setChapterPageAt,
  setMaxPagesPerChapter,
  setPagesFill,
  setTotalPages,
  unassignedPagesError,
} from "../lib/chapter-division";
import {
  isSinglePageCover,
  resolveChapters,
  spineWidthCm,
} from "../lib/cover-layout";
import type { BookConfig } from "../types";

const SEGMENT_COLORS = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
];

/** Selected segment in a toggle group reads as the primary palette color. */
export const ACTIVE_TOGGLE_CLASS =
  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary hover:data-[state=on]:bg-primary/90 hover:data-[state=on]:text-primary-foreground";

type ConfigProps = {
  bookConfig: BookConfig;
  disabled: boolean;
  onBookConfigChange: (config: BookConfig) => void;
};

/** Page count plus the cap or chapter count, depending on the division mode. */
export function BookPagesFields({
  bookConfig,
  disabled,
  onBookConfigChange,
}: ConfigProps) {
  const total = Math.max(1, bookConfig.numPages || 1);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <NumberField
        label="عدد صفحات الكتاب"
        value={bookConfig.numPages}
        disabled={disabled}
        onChange={(value) =>
          onBookConfigChange(setTotalPages(bookConfig, value))
        }
      />
      {bookConfig.division === "pages" ? (
        <NumberField
          label="الحد الأقصى لصفحات الفصل"
          value={pageCap(bookConfig)}
          disabled={disabled}
          onChange={(value) =>
            onBookConfigChange(setMaxPagesPerChapter(bookConfig, value))
          }
        />
      ) : (
        <NumberField
          label="عدد الفصول"
          min={1}
          max={total}
          value={bookConfig.chapterCount}
          disabled={disabled}
          onChange={(value) =>
            onBookConfigChange(setChapterCount(bookConfig, value))
          }
        />
      )}
    </div>
  );
}

/** The full division editor: counts, distribution, and chapter names. */
export function ChapterDivisionSection({
  bookConfig,
  disabled,
  onBookConfigChange,
}: ConfigProps) {
  const { pagesPerSpineCm } = useModels();
  const chapters = resolveChapters(bookConfig);
  const showSpine = !isSinglePageCover(bookConfig);
  const total = Math.max(1, bookConfig.numPages || 1);
  const byChapters = bookConfig.division === "chapters";
  const remaining = byChapters ? remainingPages(bookConfig) : 0;
  const allocationError = byChapters ? unassignedPagesError(bookConfig) : null;
  const used = chapters.reduce((sum, chapter) => sum + chapter.pages, 0);

  return (
    <div className="flex flex-col gap-3">
      <BookPagesFields
        bookConfig={bookConfig}
        disabled={disabled}
        onBookConfigChange={onBookConfigChange}
      />

      {!byChapters && (
        <ToggleGroup
          type="single"
          value={bookConfig.pagesFill ?? "even"}
          disabled={disabled}
          onValueChange={(value) => {
            if (value !== "max" && value !== "even") return;
            onBookConfigChange(setPagesFill(bookConfig, value));
          }}
          variant="outline"
          size="sm"
          spacing={0}
          className="w-full"
          aria-label="طريقة التوزيع"
        >
          <ToggleGroupItem
            value="even"
            className={cn(
              "flex-1 text-xs whitespace-normal",
              ACTIVE_TOGGLE_CLASS,
            )}
          >
            توزيع متساوٍ
          </ToggleGroupItem>
          <ToggleGroupItem
            value="max"
            className={cn(
              "flex-1 text-xs whitespace-normal",
              ACTIVE_TOGGLE_CLASS,
            )}
          >
            ملء الحد الأقصى
          </ToggleGroupItem>
        </ToggleGroup>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <DivisionBar
            chapters={chapters}
            total={total}
            remaining={remaining}
            invalid={allocationError !== null}
          />
          {byChapters && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="size-8 shrink-0"
                  disabled={disabled}
                  aria-label="إعادة التوزيع بالتساوي"
                  onClick={() =>
                    onBookConfigChange(resetChapterPages(bookConfig))
                  }
                >
                  <HugeiconsIcon icon={RefreshIcon} className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>إعادة التوزيع بالتساوي</TooltipContent>
            </Tooltip>
          )}
        </div>
        {allocationError ? (
          <p className="text-destructive text-[11px] font-medium" role="alert">
            {allocationError}
          </p>
        ) : (
          <p className="text-muted-foreground text-[11px]">
            {byChapters
              ? `موزّع ${used} من ${total}. لا توجد صفحات متبقية.`
              : `${chapters.length} ${chapters.length === 1 ? "فصل" : "فصول"}`}
          </p>
        )}
      </div>

      <ul className="space-y-2">
        {chapters.map((chapter, index) => (
          <li key={chapter.index} className="flex items-center gap-2">
            <span
              className={cn(
                "size-2.5 shrink-0 rounded-sm",
                SEGMENT_COLORS[index % SEGMENT_COLORS.length],
              )}
            />
            <ChapterNameField
              bookConfig={bookConfig}
              index={index}
              disabled={disabled}
              onBookConfigChange={onBookConfigChange}
            />
            {byChapters ? (
              <DraftNumberInput
                value={chapter.pages}
                disabled={disabled}
                invalid={allocationError !== null}
                onCommit={(value) =>
                  onBookConfigChange(setChapterPageAt(bookConfig, index, value))
                }
                className="h-8 w-16 md:w-24"
              />
            ) : null}
            <span className="text-muted-foreground shrink-0 text-[11px]">
              {byChapters ? "صفحة" : `${chapter.pages} صفحة`}
              {showSpine && (
                <span className="hidden font-mono md:inline" dir="ltr">
                  {" · "}
                  {spineWidthCm(chapter.pages, pagesPerSpineCm).toFixed(2)} سم
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChapterNameField({
  bookConfig,
  index,
  disabled,
  onBookConfigChange,
}: ConfigProps & { index: number }) {
  const custom = isCustomChapterName(bookConfig, index);
  return (
    <InputGroup className="h-8 min-w-0 flex-1">
      <InputGroupInput
        value={chapterNameInput(bookConfig, index)}
        disabled={disabled}
        onChange={(e) =>
          onBookConfigChange(setChapterName(bookConfig, index, e.target.value))
        }
        className="h-8"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label="تلقائي"
          title="تلقائي"
          disabled={disabled || !custom}
          onClick={() =>
            onBookConfigChange(resetChapterName(bookConfig, index))
          }
        >
          <HugeiconsIcon icon={RefreshIcon} />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

function DivisionBar({
  chapters,
  total,
  remaining,
  invalid,
}: {
  chapters: ReturnType<typeof resolveChapters>;
  total: number;
  remaining: number;
  invalid: boolean;
}) {
  const scale = Math.max(total, 1);
  return (
    <div
      className={cn(
        "bg-muted flex h-8 w-full min-w-0 flex-1 overflow-hidden rounded-md",
        invalid && "ring-destructive ring-1",
      )}
      dir="ltr"
      role="img"
      aria-label="توزيع الصفحات على الفصول"
    >
      {chapters.map((chapter, index) => (
        <ContrastSegment
          key={chapter.index}
          className={SEGMENT_COLORS[index % SEGMENT_COLORS.length]}
          width={(chapter.pages / scale) * 100}
          label={String(chapter.pages)}
          title={`${chapter.label} · ${chapter.pages}`}
        />
      ))}
      {remaining > 0 && (
        <div
          className="bg-destructive flex h-full min-w-7 items-center justify-center overflow-hidden px-0.5 text-[11px] font-semibold text-white tabular-nums"
          style={{ width: `${(remaining / scale) * 100}%` }}
          title={`متبقي ${remaining}`}
        >
          {remaining}
        </div>
      )}
    </div>
  );
}

function ContrastSegment({
  className,
  width,
  label,
  title,
}: {
  className: string;
  width: number;
  label: string;
  title: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ink, setInk] = useState("#f7f3ea");

  useLayoutEffect(() => {
    const read = () => {
      const node = ref.current;
      if (!node) return;
      setInk(inkForBackground(getComputedStyle(node).backgroundColor));
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [className]);

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-full min-w-7 items-center justify-center overflow-hidden px-0.5 text-[11px] font-semibold tabular-nums",
        className,
      )}
      style={{ width: `${width}%`, color: ink }}
      title={title}
    >
      {label}
    </div>
  );
}

function inkForBackground(color: string): string {
  const channels = color
    .match(/[\d.]+/g)
    ?.slice(0, 3)
    .map(Number);
  if (
    !channels ||
    channels.length < 3 ||
    channels.some((channel) => !Number.isFinite(channel))
  ) {
    return "#f7f3ea";
  }
  const [r, g, b] = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? "#1c1814" : "#f7f3ea";
}

function NumberField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled: boolean;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-muted-foreground text-xs font-medium">
        {label}
      </Label>
      <DraftNumberInput
        value={value}
        disabled={disabled}
        onCommit={onChange}
        className="h-8"
      />
    </div>
  );
}

function DraftNumberInput({
  value,
  disabled,
  invalid,
  onCommit,
  className,
}: {
  value: number;
  disabled: boolean;
  invalid?: boolean;
  onCommit: (value: number) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <Input
      type="number"
      inputMode="numeric"
      step={1}
      value={draft ?? String(value)}
      disabled={disabled}
      aria-invalid={invalid}
      className={className}
      onChange={(e) => {
        const next = e.target.value;
        const fromSpinner = !(e.nativeEvent as InputEvent).inputType;
        if (fromSpinner && next !== "") {
          const parsed = Number(next);
          if (Number.isFinite(parsed)) {
            onCommit(parsed);
            setDraft(null);
            return;
          }
        }
        setDraft(next);
      }}
      onBlur={() => {
        const text = draft;
        setDraft(null);
        if (text === null || text === "") return;
        const parsed = Number(text);
        if (Number.isFinite(parsed)) onCommit(parsed);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}
