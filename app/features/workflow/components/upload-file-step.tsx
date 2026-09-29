import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AiImageIcon,
  AiMagicIcon,
  Cancel01Icon,
  FileUploadIcon,
  RefreshIcon,
  TextCreationIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";
import { ImageZoom } from "@/components/ui/image-zoom";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
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
  setChapterCount,
  setChapterName,
  setChapterPageAt,
  setDivision,
  setMaxPagesPerChapter,
  setTotalPages,
  unassignedPagesError,
} from "../lib/chapter-division";
import {
  defaultChapterLabel,
  isEnglishChapterLabel,
} from "../lib/chapter-labels";
import {
  isSinglePageCover,
  resolveChapters,
  spineWidthCm,
} from "../lib/cover-layout";
import type {
  BookConfig,
  BookLanguage,
  CoverKind,
  CoverPageSize,
  Preview,
} from "../types";

const SEGMENT_COLORS = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
];

export type FileFieldProps = {
  preview: Preview | null;
  pdfPage: number;
  busy: boolean;
  onFile: (f: File | null) => void;
  onPageChange: (page: number) => void;
  /** AI result shown in place of the upload until removed. */
  outputImage: string | null;
  generating: boolean;
  extracting: boolean;
  canRunAi: boolean;
  onGenerateImage: () => void;
  onGenerateText: () => void;
  onGenerateBoth: () => void;
  onRemoveOutput: () => void;
};

/** Selected segment in a toggle group reads as the primary palette color. */
export const ACTIVE_TOGGLE_CLASS =
  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary hover:data-[state=on]:bg-primary/90 hover:data-[state=on]:text-primary-foreground";

export function UploadFileStep({
  file,
  bookConfig,
  onBookConfigChange,
  disabled,
}: {
  file: FileFieldProps;
  bookConfig: BookConfig;
  onBookConfigChange: (config: BookConfig) => void;
  disabled: boolean;
}) {
  const { pagesPerSpineCm } = useModels();
  const chapters = resolveChapters(bookConfig);
  const cap = pageCap(bookConfig);
  const singlePage = isSinglePageCover(bookConfig);
  const englishLabel = isEnglishChapterLabel(bookConfig.chapterLabel);
  const language: BookLanguage =
    bookConfig.language ?? (englishLabel ? "en" : "ar");

  const setLanguage = (next: BookLanguage) => {
    const keepLabel = (next === "en") === englishLabel;
    onBookConfigChange({
      ...bookConfig,
      language: next,
      coverSide: next === "en" ? "ltr" : "rtl",
      chapterLabel: keepLabel
        ? bookConfig.chapterLabel
        : defaultChapterLabel(next),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="نوع الغلاف">
          <Select
            value={bookConfig.coverKind ?? "wrap"}
            disabled={disabled}
            onValueChange={(value) => {
              if (value !== "wrap" && value !== "page") return;
              onBookConfigChange({
                ...bookConfig,
                coverKind: value as CoverKind,
              });
            }}
          >
            <SelectTrigger className="w-full" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wrap">غلاف وشريط</SelectItem>
              <SelectItem value="page">غلاف صفحة واحدة</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="لغة الكتاب">
          <ToggleGroup
            type="single"
            value={language}
            disabled={disabled}
            onValueChange={(value) => {
              if (value !== "ar" && value !== "en") return;
              setLanguage(value);
            }}
            variant="outline"
            size="sm"
            spacing={0}
            className="w-full"
          >
            <ToggleGroupItem
              value="en"
              className={cn("flex-1 text-xs", ACTIVE_TOGGLE_CLASS)}
            >
              English
            </ToggleGroupItem>
            <ToggleGroupItem
              value="ar"
              className={cn("flex-1 text-xs", ACTIVE_TOGGLE_CLASS)}
            >
              عربي
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>

        <Field label="حجم الغلاف">
          <Select
            value={bookConfig.pageSize ?? "a4"}
            disabled={disabled}
            onValueChange={(value) => {
              if (value !== "a4" && value !== "a5") return;
              onBookConfigChange({
                ...bookConfig,
                pageSize: value as CoverPageSize,
              });
            }}
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

        <Field label="تقسيم الفصول">
          <ToggleGroup
            type="single"
            value={bookConfig.division}
            disabled={disabled}
            onValueChange={(value) => {
              if (value !== "pages" && value !== "chapters") return;
              onBookConfigChange(setDivision(bookConfig, value));
            }}
            variant="outline"
            size="sm"
            spacing={0}
            className="w-full"
          >
            <ToggleGroupItem
              value="pages"
              className={cn(
                "flex-1 text-xs whitespace-normal",
                ACTIVE_TOGGLE_CLASS,
              )}
            >
              حسب الصفحات
            </ToggleGroupItem>
            <ToggleGroupItem
              value="chapters"
              className={cn(
                "flex-1 text-xs whitespace-normal",
                ACTIVE_TOGGLE_CLASS,
              )}
            >
              حسب الفصول
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>
      </div>

      {bookConfig.division === "pages" ? (
        <PagesDivision
          bookConfig={bookConfig}
          cap={cap}
          disabled={disabled}
          pagesPerSpineCm={pagesPerSpineCm}
          showSpine={!singlePage}
          chapters={chapters}
          onBookConfigChange={onBookConfigChange}
        />
      ) : (
        <ChaptersDivision
          bookConfig={bookConfig}
          disabled={disabled}
          pagesPerSpineCm={pagesPerSpineCm}
          showSpine={!singlePage}
          chapters={chapters}
          onBookConfigChange={onBookConfigChange}
        />
      )}

      <FileField {...file} disabled={disabled} />
      <Separator />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-muted-foreground text-xs font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

function IconAction({
  label,
  icon,
  disabled,
  busy,
  tone = "default",
  onClick,
}: {
  label: string;
  icon: typeof AiMagicIcon;
  disabled?: boolean;
  busy?: boolean;
  tone?: "default" | "primary" | "destructive";
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={onClick}
          aria-label={label}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md border transition-colors disabled:opacity-50",
            tone === "default" && "border-input hover:bg-muted text-foreground",
            tone === "primary" &&
              "bg-primary text-primary-foreground border-primary hover:bg-primary/90",
            tone === "destructive" &&
              "border-input text-muted-foreground hover:border-destructive/40 hover:text-destructive hover:bg-destructive/10",
          )}
        >
          {busy ? (
            <Spinner className="size-3.5" />
          ) : (
            <HugeiconsIcon icon={icon} className="size-4" strokeWidth={2} />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function FileField({
  preview,
  pdfPage,
  busy,
  disabled,
  onFile,
  onPageChange,
  outputImage,
  generating,
  extracting,
  canRunAi,
  onGenerateImage,
  onGenerateText,
  onGenerateBoth,
  onRemoveOutput,
}: FileFieldProps & { disabled: boolean }) {
  const [dragging, setDragging] = useState(false);
  const onFileRef = useRef(onFile);
  onFileRef.current = onFile;

  useEffect(() => {
    if (disabled) return;
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable=true]")) return;
      const items = Array.from(event.clipboardData?.items ?? []);
      const file =
        items.find((item) => item.kind === "file")?.getAsFile() ??
        event.clipboardData?.files?.[0] ??
        null;
      if (!file) return;
      event.preventDefault();
      onFileRef.current(file);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [disabled]);

  const dragProps = {
    onDragOver: (event: React.DragEvent) => {
      if (disabled) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      if (!dragging) setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      setDragging(false);
      if (disabled) return;
      onFile(event.dataTransfer.files?.[0] ?? null);
    },
  };

  const input = (
    <Input
      type="file"
      accept="image/*,application/pdf"
      className="hidden"
      disabled={disabled}
      onChange={(e) => {
        onFile(e.target.files?.[0] ?? null);
        e.target.value = "";
      }}
    />
  );

  if (!preview) {
    return (
      <Label
        {...dragProps}
        className={cn(
          "border-input bg-input/10 text-muted-foreground hover:bg-input/20 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-3 py-6 text-center text-xs transition-colors",
          dragging && "border-primary bg-primary/10 text-foreground",
          disabled && "cursor-not-allowed",
        )}
      >
        <HugeiconsIcon icon={FileUploadIcon} className="size-5" />
        <span className="text-foreground font-medium">
          {dragging ? "أفلت الملف هنا" : "صورة الغلاف أو ملف PDF"}
        </span>
        <span className="text-[11px]">
          اسحب أو اضغط
          <span className="hidden md:inline"> أو الصق بـ Ctrl+V</span>
        </span>
        {input}
      </Label>
    );
  }

  const shown = outputImage ?? preview.url;
  const aiBusy = generating || extracting;
  const aiDisabled = disabled || !canRunAi || aiBusy;

  return (
    <div
      {...dragProps}
      className={cn(
        "bg-card flex items-stretch gap-3 rounded-lg border p-2 transition-colors",
        dragging && "border-primary bg-primary/10",
      )}
    >
      <div className="bg-muted relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-md border">
        <ImageZoom>
          <img
            src={shown}
            alt={outputImage ? "الصورة المولّدة" : "صورة الغلاف"}
            className="h-24 w-[4.5rem] object-cover"
          />
        </ImageZoom>
        {outputImage && !generating && (
          <span className="bg-primary text-primary-foreground pointer-events-none absolute start-1 top-1 rounded px-1 text-[9px] font-semibold">
            AI
          </span>
        )}
        {(busy || generating) && (
          <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
            <Spinner />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 py-0.5">
        <div className="flex items-center gap-1.5">
          <IconAction
            label="توليد الصورة بالذكاء الاصطناعي"
            icon={AiImageIcon}
            tone="primary"
            disabled={aiDisabled}
            busy={generating && !extracting}
            onClick={onGenerateImage}
          />
          <IconAction
            label="استخراج الاسم والوصف"
            icon={TextCreationIcon}
            tone="primary"
            disabled={aiDisabled}
            busy={extracting && !generating}
            onClick={onGenerateText}
          />
          <IconAction
            label="الاسم والوصف ثم الصورة"
            icon={AiMagicIcon}
            tone="primary"
            disabled={aiDisabled}
            busy={generating && extracting}
            onClick={onGenerateBoth}
          />
          {outputImage && (
            <IconAction
              label="إزالة الصورة المولّدة"
              icon={Cancel01Icon}
              tone="destructive"
              disabled={disabled || generating}
              onClick={onRemoveOutput}
            />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Label
                aria-label="استبدال الملف"
                className={cn(
                  "border-input hover:bg-muted flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors",
                  disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <HugeiconsIcon
                  icon={RefreshIcon}
                  className="size-4"
                  strokeWidth={2}
                />
                {input}
              </Label>
            </TooltipTrigger>
            <TooltipContent>استبدال الملف</TooltipContent>
          </Tooltip>
          {preview.kind === "pdf" && (
            <Input
              type="number"
              min={1}
              value={pdfPage}
              disabled={disabled || busy}
              onChange={(e) => onPageChange(Number(e.target.value) || 1)}
              aria-label="صفحة PDF"
              title="صفحة PDF"
              className="h-8 w-16 text-xs"
            />
          )}
          <span className="text-muted-foreground truncate text-[11px]">
            {preview.kind === "pdf" ? "PDF" : "صورة"}
            {outputImage ? " · مولّدة" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

function PagesDivision({
  bookConfig,
  cap,
  disabled,
  pagesPerSpineCm,
  showSpine,
  chapters,
  onBookConfigChange,
}: {
  bookConfig: BookConfig;
  cap: number;
  disabled: boolean;
  pagesPerSpineCm: number;
  showSpine: boolean;
  chapters: ReturnType<typeof resolveChapters>;
  onBookConfigChange: (config: BookConfig) => void;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          label="عدد صفحات الكتاب"
          value={bookConfig.numPages}
          disabled={disabled}
          onChange={(value) =>
            onBookConfigChange(setTotalPages(bookConfig, value))
          }
        />
        <NumberField
          label="الحد الأقصى لصفحات الفصل"
          value={cap}
          disabled={disabled}
          onChange={(value) =>
            onBookConfigChange(setMaxPagesPerChapter(bookConfig, value))
          }
        />
      </div>
      <ChapterNameList
        bookConfig={bookConfig}
        chapters={chapters}
        pagesPerSpineCm={pagesPerSpineCm}
        showSpine={showSpine}
        disabled={disabled}
        onBookConfigChange={onBookConfigChange}
      />
    </>
  );
}

function ChaptersDivision({
  bookConfig,
  disabled,
  pagesPerSpineCm,
  showSpine,
  chapters,
  onBookConfigChange,
}: {
  bookConfig: BookConfig;
  disabled: boolean;
  pagesPerSpineCm: number;
  showSpine: boolean;
  chapters: ReturnType<typeof resolveChapters>;
  onBookConfigChange: (config: BookConfig) => void;
}) {
  const total = Math.max(1, bookConfig.numPages || 1);
  const used = chapters.reduce((sum, chapter) => sum + chapter.pages, 0);
  const remaining = remainingPages(bookConfig);
  const allocationError = unassignedPagesError(bookConfig);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          label="عدد صفحات الكتاب"
          value={bookConfig.numPages}
          disabled={disabled}
          onChange={(value) =>
            onBookConfigChange(setTotalPages(bookConfig, value))
          }
        />
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
      </div>

      <div className="flex flex-col gap-2">
        <DivisionBar
          chapters={chapters}
          total={total}
          remaining={remaining}
          invalid={allocationError !== null}
        />
        {allocationError ? (
          <p className="text-destructive text-[11px] font-medium" role="alert">
            {allocationError}
          </p>
        ) : (
          <p className="text-muted-foreground text-[11px]">
            موزّع {used} من {total}. لا توجد صفحات متبقية.
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
            <DraftNumberInput
              value={chapter.pages}
              disabled={disabled}
              invalid={allocationError !== null}
              onCommit={(value) =>
                onBookConfigChange(setChapterPageAt(bookConfig, index, value))
              }
              className="h-8 w-16 md:w-24"
            />
            <span className="text-muted-foreground shrink-0 text-[11px]">
              صفحة
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
    </>
  );
}

function ChapterNameList({
  bookConfig,
  chapters,
  pagesPerSpineCm,
  showSpine,
  disabled,
  onBookConfigChange,
}: {
  bookConfig: BookConfig;
  chapters: ReturnType<typeof resolveChapters>;
  pagesPerSpineCm: number;
  showSpine: boolean;
  disabled: boolean;
  onBookConfigChange: (config: BookConfig) => void;
}) {
  const total = Math.max(1, bookConfig.numPages || 1);
  return (
    <div className="flex flex-col gap-2">
      <DivisionBar
        chapters={chapters}
        total={total}
        remaining={0}
        invalid={false}
      />
      <p className="text-muted-foreground text-[11px]">
        {chapters.length} {chapters.length === 1 ? "فصل" : "فصول"}
      </p>
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
            <span className="text-muted-foreground shrink-0 text-[11px]">
              {chapter.pages} صفحة
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
}: {
  bookConfig: BookConfig;
  index: number;
  disabled: boolean;
  onBookConfigChange: (config: BookConfig) => void;
}) {
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
        "bg-muted flex h-8 w-full overflow-hidden rounded-md",
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
